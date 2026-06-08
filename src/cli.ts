import { parseArgs } from "./cli-args";
import { collectInteractiveInputs } from "./prompts";
import { runCreate } from "./commands/create";
import { loadSnapshot, formatSnapshotBanner } from "./stack/snapshot";
import { err, log, ok } from "./util/logger";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ValidationError } from "./prompts-validate";
import { validateName, validatePackage, validateArch } from "./prompts-validate";

const USAGE = `Usage: create-android [projectDir] [flags]

Flags:
  -n, --name <string>       App name
  -p, --package <string>    Android application id (e.g. com.example.app)
  -a, --arch <multi|single> Project shape
      --stack               Print pinned stack snapshot and exit
  -v, --version             Print scaffolder version and exit
  -h, --help                Print this message and exit
      --force               Overwrite a non-empty target directory
      --dry-run             Render to a temp dir, print summary, do not write
      --no-install          Skip the "Next steps" printout
`;

function repoRootFromHere(): string {
  if (process.env.CREATE_ANDROID_ROOT) {
    return process.env.CREATE_ANDROID_ROOT;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..");
}

async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if (!parsed.ok) {
    err(parsed.error);
    log(USAGE);
    return 2;
  }
  const { projectDir, flags } = parsed.value;

  if (flags.help) {
    log(USAGE);
    return 0;
  }

  if (flags.version) {
    const repoRoot = repoRootFromHere();
    try {
      const pkg = await import(resolve(repoRoot, "package.json"), {
        with: { type: "json" },
      });
      ok(`create-android v${pkg.default.version}`);
    } catch {
      ok("create-android (unknown version)");
    }
    return 0;
  }

  if (flags.stack) {
    const repoRoot = repoRootFromHere();
    const snap = await loadSnapshot(repoRoot);
    log(formatSnapshotBanner(snap));
    return 0;
  }

  try {
    if (flags.name) validateName(flags.name);
    if (flags.package) validatePackage(flags.package);
    if (flags.arch) validateArch(flags.arch);
  } catch (e) {
    if (e instanceof ValidationError) {
      err(e.message);
      return 1;
    }
    throw e;
  }

  const isTTY = Boolean(process.stdout.isTTY);
  let inputs;
  try {
    inputs = await collectInteractiveInputs({
      provided: {
        projectDir: projectDir,
        name: flags.name,
        package: flags.package,
        arch: flags.arch,
      },
      isTTY,
    });
  } catch (e) {
    err((e as Error).message);
    return 1;
  }

  const repoRoot = repoRootFromHere();
  const res = await runCreate({
    repoRoot,
    inputs,
    isTTY,
    force: flags.force === true,
    dryRun: flags.dryRun === true,
    noInstall: flags.noInstall === true || flags.dryRun === true,
  });
  return res.exitCode;
}

const isDirect =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("cli.ts") ||
  process.argv[1]?.endsWith("cli.js");

if (isDirect) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      err((e as Error).message);
      process.exit(1);
    },
  );
}
