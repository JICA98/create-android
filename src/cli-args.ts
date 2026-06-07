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
      const eqIdx = a.indexOf("=");
      const rawKey = eqIdx >= 0 ? a.slice(2, eqIdx) : a.slice(2);
      const inlineVal = eqIdx >= 0 ? a.slice(eqIdx + 1) : undefined;

      if (rawKey === "stack" || rawKey === "version" || rawKey === "help" || rawKey === "force" || rawKey === "dry-run" || rawKey === "no-install") {
        if (inlineVal !== undefined) return { ok: false, error: `flag --${rawKey} does not accept a value` };
        if (rawKey === "dry-run") flags.dryRun = true;
        else if (rawKey === "no-install") flags.noInstall = true;
        else (flags as Record<string, unknown>)[rawKey] = true;
        i++;
        continue;
      }
      const key = rawKey as keyof Flags;
      let value: string | undefined = inlineVal;
      if (value === undefined) {
        value = argv[i + 1];
        if (value === undefined) return { ok: false, error: `flag --${rawKey} requires a value` };
        if (value.startsWith("-")) return { ok: false, error: `flag --${rawKey} requires a value (got ${value})` };
        i++;
      }
      if (key === "name" || key === "package" || key === "arch") {
        (flags as Record<string, unknown>)[key] = value;
        i++;
        continue;
      }
      return { ok: false, error: `unknown flag --${rawKey}` };
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
