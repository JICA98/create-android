#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");

type Target = {
  goos: "darwin" | "linux" | "windows";
  goarch: "arm64" | "x64";
  pkg: string;
};

const TARGETS: Target[] = [
  { goos: "darwin", goarch: "arm64", pkg: "darwin-arm64" },
  { goos: "darwin", goarch: "x64", pkg: "darwin-x64" },
  { goos: "linux", goarch: "x64", pkg: "linux-x64" },
  { goos: "linux", goarch: "arm64", pkg: "linux-arm64" },
  { goos: "windows", goarch: "x64", pkg: "windows-x64" },
];

const VERSION = process.env.VERSION ?? "0.0.0-dev";

async function main() {
  for (const t of TARGETS) {
    const outDir = resolve(ROOT, "packages", t.pkg, "bin");
    mkdirSync(outDir, { recursive: true });
    const ext = t.goos === "windows" ? ".exe" : "";
    const out = resolve(outDir, `create-android${ext}`);
    console.log(`[build] ${t.goos}/${t.goarch} → ${out}`);
    await $`bun build ./src/cli.ts --compile --target=bun-${t.goos}-${t.goarch} --outfile=${out}`.quiet();
  }
  console.log("[build] done");
  void VERSION;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
