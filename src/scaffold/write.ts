import {
  writeFile as fsWriteFile,
  mkdir,
  rm,
  stat,
  chmod,
} from "node:fs/promises";
import { dirname, basename } from "node:path";

const EXECUTABLE = new Set(["gradlew", "gradlew.bat", "build-and-install.sh"]);

export async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}

export async function writeFile(p: string, content: string): Promise<void> {
  await ensureDir(dirname(p));
  await fsWriteFile(p, content, "utf8");
  if (EXECUTABLE.has(basename(p))) {
    await chmod(p, 0o755);
  }
}

export async function writeBinaryFile(p: string, content: Buffer): Promise<void> {
  await ensureDir(dirname(p));
  await fsWriteFile(p, content);
}

export async function removeTree(p: string): Promise<void> {
  try {
    await stat(p);
  } catch {
    return;
  }
  await rm(p, { recursive: true, force: true });
}
