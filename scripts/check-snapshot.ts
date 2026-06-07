#!/usr/bin/env bun
import { loadSnapshot } from "../src/stack/snapshot";
import type { Snapshot } from "../src/stack/snapshot";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const VERSIONED_FILES = [
  "build.gradle.kts",
  "settings.gradle.kts",
  "gradle/libs.versions.toml",
  "gradle/wrapper/gradle-wrapper.properties",
];

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function visit(d: string) {
    const entries = await readdir(d);
    for (const e of entries) {
      const abs = join(d, e);
      const s = await stat(abs);
      if (s.isDirectory()) await visit(abs);
      else out.push(abs);
    }
  }
  await visit(dir);
  return out;
}

function findAll(haystack: string, needle: string): string[] {
  const found: string[] = [];
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    found.push(haystack.slice(i, i + needle.length));
    i += needle.length;
  }
  return found;
}

async function checkArch(arch: "single" | "multi", snap: Snapshot): Promise<string[]> {
  const errors: string[] = [];
  const archRoot = join(ROOT, "templates", arch);
  const nameDir = join(archRoot, "__name__");
  const files = await walk(nameDir);
  for (const f of files) {
    if (!VERSIONED_FILES.some((v) => f.endsWith(v))) continue;
    const text = await readFile(f, "utf8");
    for (const [key, value] of [
      ["{{agp}}", snap.agp],
      ["{{kotlin}}", snap.kotlin],
      ["{{gradle}}", snap.gradle],
      ["{{compileSdk}}", String(snap.compileSdk)],
      ["{{targetSdk}}", String(snap.targetSdk)],
      ["{{minSdk}}", String(snap.minSdk)],
      ["{{ndk}}", snap.ndk],
    ] as const) {
      if (!text.includes(key)) {
        errors.push(`${f}: missing placeholder ${key}`);
      }
    }
    const placeholders = [
      ...findAll(text, "{{name}}"),
      ...findAll(text, "{{package}}"),
      ...findAll(text, "{{packagePath}}"),
      ...findAll(text, "{{packageNamespace}}"),
      ...findAll(text, "{{packageName}}"),
    ];
    if (placeholders.length === 0) {
      errors.push(`${f}: no expected placeholders; check the file is a template`);
    }
  }
  return errors;
}

async function main() {
  const snap = await loadSnapshot(ROOT);
  const errors: string[] = [];
  for (const arch of ["single", "multi"] as const) {
    errors.push(...(await checkArch(arch, snap)));
  }
  if (errors.length > 0) {
    console.error("check-snapshot failed:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("check-snapshot: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
