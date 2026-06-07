import { stat, readdir } from "node:fs/promises";
import { resolve, isAbsolute } from "node:path";

const TRIVIAL_CONTENTS = new Set([".DS_Store"]);

export async function resolveProjectDir(
  input: string,
  cwd: string,
): Promise<string | null> {
  const abs = isAbsolute(input) ? input : resolve(cwd, input);
  const cwdAbs = resolve(cwd);

  // Refuse to escape cwd.
  if (abs !== cwdAbs && !abs.startsWith(cwdAbs + "/")) {
    return null;
  }

  try {
    const s = await stat(abs);
    if (s.isFile()) return null;
    if (s.isDirectory()) {
      const contents = await readdir(abs);
      const nonTrivial = contents.filter((c) => !TRIVIAL_CONTENTS.has(c));
      if (nonTrivial.length > 0) return null;
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  return abs;
}

export function isSensitiveProjectDir(abs: string): boolean {
  if (abs === "/") return true;
  const home = process.env.HOME ?? "";
  if (home && abs === home) return true;
  return false;
}
