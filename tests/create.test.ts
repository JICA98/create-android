import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { runCreate } from "../src/commands/create";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

let cwd: string;
beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), "create-"));
});
afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

describe("runCreate", () => {
  test("scaffolds a single-arch project end-to-end", async () => {
    const out = join(cwd, "Demo");
    const res = await runCreate({
      repoRoot,
      inputs: {
        projectDir: out,
        name: "Demo",
        package: "com.example.demo",
        arch: "single",
      },
      isTTY: false,
    });
    expect(res.exitCode).toBe(0);
    const rootStat = await stat(join(out, "Demo"));
    expect(rootStat.isDirectory()).toBe(true);
    const settings = await readFile(join(out, "Demo", "settings.gradle.kts"), "utf8");
    expect(settings).toContain('rootProject.name = "Demo"');
  });

  test("refuses to write into a non-empty existing dir without --force", async () => {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const out = join(cwd, "Demo");
    await mkdir(out);
    await writeFile(join(out, "marker"), "x");
    const res = await runCreate({
      repoRoot,
      inputs: {
        projectDir: out,
        name: "Demo",
        package: "com.example.demo",
        arch: "single",
      },
      isTTY: false,
    });
    expect(res.exitCode).toBe(1);
    expect(res.stderr).toContain("non-empty");
  });

  test("with --force, overwrites a non-empty dir", async () => {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const out = join(cwd, "Demo");
    await mkdir(out);
    await writeFile(join(out, "marker"), "x");
    const res = await runCreate({
      repoRoot,
      inputs: {
        projectDir: out,
        name: "Demo",
        package: "com.example.demo",
        arch: "single",
      },
      isTTY: false,
      force: true,
    });
    expect(res.exitCode).toBe(0);
  });
});
