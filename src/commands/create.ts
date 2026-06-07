import { renderTemplate } from "../scaffold/render";
import { loadSnapshot, formatSnapshotBanner, type Snapshot } from "../stack/snapshot";
import { isSensitiveProjectDir } from "../scaffold/projectdir";
import { deriveTokens, type Tokens } from "../scaffold/tokens";
import { err, header, log, ok, warn } from "../util/logger";
import { readdir, stat } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

const TRIVIAL_CONTENTS = new Set([".DS_Store", ".git"]);

export type CreateInputs = {
  projectDir: string;
  name: string;
  package: string;
  arch: "multi" | "single";
};

export type CreateOpts = {
  repoRoot: string;
  inputs: CreateInputs;
  isTTY: boolean;
  force?: boolean;
  dryRun?: boolean;
  noInstall?: boolean;
};

export type CreateResult = {
  exitCode: 0 | 1 | 2;
  stdout: string;
  stderr: string;
};

function buildTokens(snap: Snapshot, inputs: CreateInputs): Tokens {
  const base = deriveTokens({ name: inputs.name, package: inputs.package });
  return {
    ...base,
    agp: snap.agp,
    kotlin: snap.kotlin,
    gradle: snap.gradle,
    compileSdk: String(snap.compileSdk),
    targetSdk: String(snap.targetSdk),
    minSdk: String(snap.minSdk),
    ndk: snap.ndk,
    composeBom: snap.composeBom,
    hilt: snap.hilt,
  };
}

export async function runCreate(opts: CreateOpts): Promise<CreateResult> {
  const { repoRoot, inputs, force, dryRun, noInstall } = opts;

  const targetDir = isAbsolute(inputs.projectDir)
    ? inputs.projectDir
    : resolve(process.cwd(), inputs.projectDir);

  if (isSensitiveProjectDir(targetDir)) {
    err(`refusing to scaffold into sensitive location: ${targetDir}`);
    return { exitCode: 1, stdout: "", stderr: "sensitive location" };
  }

  try {
    const s = await stat(targetDir);
    if (s.isFile()) {
      err(`target is a file: ${targetDir}`);
      return { exitCode: 1, stdout: "", stderr: "target is a file" };
    }
    if (s.isDirectory()) {
      const contents = await readdir(targetDir);
      const nonTrivial = contents.filter((c) => !TRIVIAL_CONTENTS.has(c));
      if (nonTrivial.length > 0) {
        if (!force) {
          err(`target is non-empty: ${targetDir}`);
          return { exitCode: 1, stdout: "", stderr: "non-empty" };
        }
        warn(`overwriting non-empty target: ${targetDir}`);
      }
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }

  const snap = await loadSnapshot(repoRoot);
  const tokens = buildTokens(snap, inputs);
  const templateRoot = join(repoRoot, "templates", inputs.arch);

  try {
    const s = await stat(templateRoot);
    if (!s.isDirectory()) throw new Error("not a dir");
  } catch {
    err(`internal error: missing template at ${templateRoot}`);
    return { exitCode: 1, stdout: "", stderr: "missing template" };
  }

  if (dryRun) {
    ok(`would scaffold ${inputs.arch} template into ${targetDir}`);
    return { exitCode: 0, stdout: "dry-run", stderr: "" };
  }

  await renderTemplate({ templateRoot, outDir: targetDir, tokens });

  ok(`Created ${targetDir}/${inputs.name} from template ${inputs.arch}`);
  header(`Stack: ${formatSnapshotBanner(snap)}`);

  if (!noInstall) {
    log("");
    log("Next steps:");
    log(`  cd ${inputs.name}`);
    log("  ./gradlew :app:assembleDebug");
  }

  return { exitCode: 0, stdout: "", stderr: "" };
}
