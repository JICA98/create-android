export type Tokens = {
  name: string;
  package: string;
  packagePath: string;
  packageNamespace: string;
  packageName: string;
};

export type RawInputs = {
  name: string;
  package: string;
};

export const tokenKeys = [
  "name",
  "package",
  "packagePath",
  "packageNamespace",
  "packageName",
] as const satisfies ReadonlyArray<keyof Tokens>;

export function deriveTokens(raw: RawInputs): Tokens {
  const segments = raw.package.split(".").filter((s) => s.length > 0);
  const packageName = segments[segments.length - 1] ?? "";
  const packageNamespace = segments.slice(0, -1).join(".");
  return {
    name: raw.name,
    package: raw.package,
    packagePath: segments.join("/"),
    packageNamespace,
    packageName,
  };
}

export function applyContentTokens(input: string, t: Tokens): string {
  return input.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in t) return t[key as keyof Tokens];
    return match;
  });
}
