#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const mainPkg = JSON.parse(
  readFileSync(resolve(here, "..", "package.json"), "utf8"),
);

const require = createRequire(import.meta.url);

const map = {
  "darwin+arm64": "@flux/create-android-darwin-arm64",
  "darwin+x64":   "@flux/create-android-darwin-x64",
  "linux+x64":    "@flux/create-android-linux-x64",
  "linux+arm64":  "@flux/create-android-linux-arm64",
  "win32+x64":    "@flux/create-android-windows-x64",
};

const key = `${process.platform}+${process.arch}`;
const pkg = map[key];

if (!pkg) {
  console.error(`create-android: unsupported platform ${key}`);
  console.error(
    `Supported: ${Object.keys(map).join(", ")}. ` +
    `For other platforms, run via Bun: \`bunx @flux/create-android@${mainPkg.version}\`.`,
  );
  process.exit(1);
}

let binPath;
try {
  binPath = require.resolve(`${pkg}/bin/create-android`);
} catch {
  console.error(
    `create-android: platform binary not installed (${pkg}). ` +
    `Re-run with: npm i -g @flux/create-android@${mainPkg.version}`,
  );
  process.exit(1);
}

try {
  execFileSync(binPath, process.argv.slice(2), { stdio: "inherit" });
} catch (e) {
  process.exit(e.status ?? 1);
}
