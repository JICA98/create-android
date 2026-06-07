import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { renderTemplate } from "../src/scaffold/render";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = join(repoRoot, "tests", "fixtures", "template-minimal");

let out: string;
beforeEach(async () => {
  out = await mkdtemp(join(tmpdir(), "render-"));
});
afterEach(async () => {
  // best-effort cleanup
  try {
    const { rm } = await import("node:fs/promises");
    await rm(out, { recursive: true, force: true });
  } catch {}
});

describe("renderTemplate", () => {
  test("renames __name__ in directory paths", async () => {
    const tokens = {
      name: "MyApp",
      package: "com.x",
      packagePath: "com/x",
      packageNamespace: "com",
      packageName: "x",
    };
    await renderTemplate({
      templateRoot,
      outDir: out,
      tokens,
    });
    const s = await stat(join(out, "MyApp"));
    expect(s.isDirectory()).toBe(true);
  });

  test("substitutes {{name}} and {{package}} inside file contents", async () => {
    const tokens = {
      name: "MyApp",
      package: "com.x.y",
      packagePath: "com/x/y",
      packageNamespace: "com.x",
      packageName: "y",
    };
    await renderTemplate({ templateRoot, outDir: out, tokens });
    const manifest = await readFile(
      join(out, "MyApp", "src", "main", "AndroidManifest.xml"),
      "utf8",
    );
    expect(manifest).toContain("com.x.y");
    expect(manifest).toContain("MyApp");
    expect(manifest).not.toContain("{{name}}");
    expect(manifest).not.toContain("{{package}}");
  });

  test("does not include the literal __name__ segment in output paths", async () => {
    const tokens = {
      name: "X",
      package: "a.b",
      packagePath: "a/b",
      packageNamespace: "a",
      packageName: "b",
    };
    await renderTemplate({ templateRoot, outDir: out, tokens });
    await expect(stat(join(out, "__name__"))).rejects.toThrow();
  });
});
