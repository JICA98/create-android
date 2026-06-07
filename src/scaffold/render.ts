import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { applyContentTokens, type Tokens } from "./tokens";
import { writeFile, writeBinaryFile, ensureDir } from "./write";

export type RenderOptions = {
  templateRoot: string;
  outDir: string;
  tokens: Tokens;
};

const IGNORE_ENTRIES = new Set([".git", ".DS_Store", "__pycache__"]);

type Entry = {
  relPath: string;
  absPath: string;
  isFile: boolean;
  isDir: boolean;
};

async function walk(root: string): Promise<Entry[]> {
  const out: Entry[] = [];
  async function visit(abs: string, rel: string) {
    const s = await stat(abs);
    if (s.isDirectory()) {
      out.push({ absPath: abs, relPath: rel, isDir: true, isFile: false });
      for (const child of await readdir(abs)) {
        if (IGNORE_ENTRIES.has(child)) continue;
        await visit(join(abs, child), rel ? join(rel, child) : child);
      }
    } else {
      out.push({ absPath: abs, relPath: rel, isDir: false, isFile: true });
    }
  }
  await visit(root, "");
  return out;
}

function resolveRelPath(relPath: string, tokens: Tokens): string {
  return relPath
    .split("/")
    .map((seg) => (seg === "__name__" ? tokens.name : seg))
    .join("/");
}

function isBinaryBuffer(buf: Buffer): boolean {
  // Heuristic: presence of NUL byte in first 8KB.
  const sample = buf.subarray(0, Math.min(buf.length, 8192));
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) return true;
  }
  return false;
}

export async function renderTemplate(opts: RenderOptions): Promise<{
  files: number;
  dirs: number;
}> {
  const { templateRoot, outDir, tokens } = opts;
  const entries = await walk(templateRoot);
  // Sort for determinism: directories first then files; then alphabetical.
  entries.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.relPath.localeCompare(b.relPath);
  });

  let files = 0;
  let dirs = 0;
  for (const e of entries) {
    const rel = resolveRelPath(e.relPath, tokens);
    const outAbs = join(outDir, rel);
    if (e.isDir) {
      await ensureDir(outAbs);
      dirs++;
    } else {
      const buf = await readFile(e.absPath);
      if (isBinaryBuffer(buf)) {
        await writeBinaryFile(outAbs, buf);
      } else {
        const text = applyContentTokens(buf.toString("utf8"), tokens);
        await writeFile(outAbs, text);
      }
      files++;
    }
  }
  return { files, dirs };
}
