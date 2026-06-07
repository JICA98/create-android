import { describe, expect, test } from "bun:test";
import { resolveProjectDir, isSensitiveProjectDir } from "../src/scaffold/projectdir";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("resolveProjectDir", () => {
  test("resolves a relative dir under cwd", async () => {
    const out = await resolveProjectDir("./MyApp", process.cwd());
    expect(out).toBe(join(process.cwd(), "MyApp"));
  });

  test("normalizes '..' to keep the result under cwd (refuses escape)", async () => {
    const out = await resolveProjectDir("../escape", process.cwd());
    // Should refuse to escape cwd.
    expect(out).toBeNull();
  });

  test("returns null for an existing non-empty dir", async () => {
    const d = await mkdtemp(join(tmpdir(), "scaffold-"));
    await writeFile(join(d, "marker"), "x");
    const out = await resolveProjectDir(d, d);
    expect(out).toBeNull();
  });

  test("accepts an existing empty dir", async () => {
    const d = await mkdtemp(join(tmpdir(), "scaffold-"));
    const out = await resolveProjectDir(d, d);
    expect(out).toBe(d);
  });

  test("accepts a non-existing path", async () => {
    const d = await mkdtemp(join(tmpdir(), "scaffold-"));
    const out = await resolveProjectDir(join(d, "new"), d);
    expect(out).toBe(join(d, "new"));
  });
});

describe("isSensitiveProjectDir", () => {
  test("flags '/' and home", () => {
    expect(isSensitiveProjectDir("/")).toBe(true);
    const home = process.env.HOME ?? "";
    if (home) expect(isSensitiveProjectDir(home)).toBe(true);
  });

  test("does not flag a normal subdir", async () => {
    const d = await mkdtemp(join(tmpdir(), "scaffold-"));
    const sub = join(d, "ok");
    await mkdir(sub);
    expect(isSensitiveProjectDir(sub)).toBe(false);
  });
});
