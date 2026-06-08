#!/usr/bin/env bun
import { $ } from "bun";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-x64",
  "linux-arm64",
  "windows-x64",
];

async function setVersion(dir: string, version: string) {
  const p = resolve(dir, "package.json");
  const pkg = JSON.parse(await readFile(p, "utf8"));
  pkg.version = version;
  await writeFile(p, JSON.stringify(pkg, null, 2) + "\n");
}

async function updateOptionalDepVersions(root: string, version: string) {
  const p = resolve(root, "package.json");
  const pkg = JSON.parse(await readFile(p, "utf8"));
  if (pkg.optionalDependencies) {
    for (const key of Object.keys(pkg.optionalDependencies)) {
      pkg.optionalDependencies[key] = version;
    }
  }
  await writeFile(p, JSON.stringify(pkg, null, 2) + "\n");
}

async function main() {
  await $`bun test`.quiet();
  await $`bun run scripts/check-snapshot.ts`.quiet();

  const versionArg = process.argv.find((a) => a.startsWith("--version="));
  if (!versionArg) {
    console.error("usage: bun run scripts/publish.ts --version=X.Y.Z [--dry-run]");
    process.exit(2);
  }
  const version = versionArg.split("=")[1]!;
  const dryRun = process.argv.includes("--dry-run");

  if (process.env.NPM_TOKEN) {
    process.env["NPM_CONFIG_//registry.npmjs.org/:_authToken"] = process.env.NPM_TOKEN;
  }

  await setVersion(ROOT, version);
  for (const p of PLATFORMS) {
    await setVersion(resolve(ROOT, "packages", p), version);
  }
  await updateOptionalDepVersions(ROOT, version);
  console.log(`[publish] bumped all packages to ${version}`);

  await $`bun run scripts/build.ts`.quiet();

  for (const p of PLATFORMS) {
    const dir = resolve(ROOT, "packages", p);
    const args = dryRun ? ["publish", "--dry-run", "--access", "public"] : ["publish", "--access", "public"];
    console.log(`[publish] ${p}`);
    await $`npm ${args}`.cwd(dir).quiet();
  }
  const mainArgs = dryRun ? ["publish", "--dry-run", "--access", "public"] : ["publish", "--access", "public"];
  console.log(`[publish] create-android`);
  await $`npm ${mainArgs}`.cwd(ROOT).quiet();

  console.log("[publish] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
