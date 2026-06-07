import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { writeFile, writeBinaryFile, ensureDir, removeTree } from "../src/scaffold/write";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "write-"));
});
afterEach(async () => {
  await removeTree(root);
});

describe("ensureDir", () => {
  test("creates nested directories", async () => {
    await ensureDir(join(root, "a", "b", "c"));
    const s = await stat(join(root, "a", "b", "c"));
    expect(s.isDirectory()).toBe(true);
  });

  test("is a no-op if the directory already exists", async () => {
    await ensureDir(root);
    await ensureDir(root);
    const s = await stat(root);
    expect(s.isDirectory()).toBe(true);
  });
});

describe("writeFile", () => {
  test("writes text content and creates parent dirs", async () => {
    const p = join(root, "deep", "file.txt");
    await writeFile(p, "hello");
    expect(await readFile(p, "utf8")).toBe("hello");
  });

  test("overwrites existing files", async () => {
    const p = join(root, "f.txt");
    await writeFile(p, "first");
    await writeFile(p, "second");
    expect(await readFile(p, "utf8")).toBe("second");
  });
});

describe("writeBinaryFile", () => {
  test("writes Buffer content", async () => {
    const p = join(root, "blob.bin");
    const buf = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    await writeBinaryFile(p, buf);
    const got = await readFile(p);
    expect(got.equals(buf)).toBe(true);
  });
});

describe("removeTree", () => {
  test("removes a directory tree (best-effort)", async () => {
    await ensureDir(join(root, "sub"));
    await writeFile(join(root, "sub", "f"), "x");
    await removeTree(join(root, "sub"));
    await expect(stat(join(root, "sub"))).rejects.toThrow();
  });
});
