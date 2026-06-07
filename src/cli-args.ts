export type Flags = {
  name?: string;
  package?: string;
  arch?: "multi" | "single";
  stack?: boolean;
  version?: boolean;
  help?: boolean;
  force?: boolean;
  dryRun?: boolean;
  noInstall?: boolean;
};

export type ParsedArgs = {
  projectDir?: string;
  flags: Flags;
};

export type ParseResult =
  | { ok: true; value: ParsedArgs }
  | { ok: false; error: string };

const SHORTS: Record<string, keyof Flags> = {
  n: "name",
  p: "package",
  a: "arch",
  v: "version",
  h: "help",
};

export function parseArgs(argv: string[]): ParseResult {
  const flags: Flags = {};
  let projectDir: string | undefined;
  let i = 0;
  while (i < argv.length) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (key === "stack" || key === "version" || key === "help" || key === "force" || key === "dry-run" || key === "no-install") {
        if (key === "dry-run") flags.dryRun = true;
        else if (key === "no-install") flags.noInstall = true;
        else (flags as Record<string, unknown>)[key] = true;
        i++;
        continue;
      }
      const target = key as keyof Flags;
      const next = argv[i + 1];
      if (next === undefined) return { ok: false, error: `flag --${key} requires a value` };
      if (target === "name" || target === "package" || target === "arch") {
        (flags as Record<string, unknown>)[target] = next;
        i += 2;
        continue;
      }
      return { ok: false, error: `unknown flag --${key}` };
    } else if (a.startsWith("-") && a.length === 2) {
      const short = a.slice(1);
      const target = SHORTS[short];
      if (!target) return { ok: false, error: `unknown flag -${short}` };
      const next = argv[i + 1];
      if (next === undefined) return { ok: false, error: `flag -${short} requires a value` };
      (flags as Record<string, unknown>)[target] = next;
      i += 2;
      continue;
    } else {
      if (projectDir !== undefined) {
        return { ok: false, error: `unexpected extra positional: ${a}` };
      }
      projectDir = a;
      i++;
    }
  }
  if (flags.arch && flags.arch !== "multi" && flags.arch !== "single") {
    return { ok: false, error: `--arch must be "multi" or "single"` };
  }
  return { ok: true, value: { projectDir, flags } };
}
