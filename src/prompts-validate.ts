export const RESERVED_NAMES: ReadonlySet<string> = new Set([
  "test",
  "core",
  "build",
  "gradle",
  "settings",
  "app",
]);

const RESERVED_PACKAGE_PREFIXES: ReadonlyArray<string> = [
  "java",
  "javax",
  "kotlin",
  "android",
];

const JAVA_RESERVED_KEYWORDS: ReadonlySet<string> = new Set([
  "abstract", "assert", "boolean", "break", "byte", "case", "catch",
  "char", "class", "const", "continue", "default", "do", "double",
  "else", "enum", "extends", "final", "finally", "float", "for",
  "fun", "goto", "if", "implements", "import", "instanceof", "int",
  "interface", "let", "long", "native", "new", "null", "object",
  "package", "private", "protected", "public", "return", "sealed",
  "short", "static", "strictfp", "super", "switch", "synchronized",
  "this", "throw", "throws", "trait", "transient", "true", "try",
  "typeof", "val", "var", "void", "volatile", "while",
]);

const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;
const PACKAGE_SEGMENT = /^[a-z][a-z0-9_]*$/;

export class ValidationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ValidationError";
  }
}

export function validateName(input: string): string {
  if (input.length === 0) {
    throw new ValidationError("name must not be empty");
  }
  if (!NAME_PATTERN.test(input)) {
    throw new ValidationError(
      "name must be a PascalCase identifier (letters and digits, must start with a letter)",
    );
  }
  if (RESERVED_NAMES.has(input.toLowerCase())) {
    throw new ValidationError(`name "${input}" is reserved`);
  }
  return input;
}

export function validatePackage(input: string): string {
  const segments = input.split(".").filter((s) => s.length > 0);
  if (segments.length < 2) {
    throw new ValidationError("package must have at least 2 dotted segments");
  }
  if (RESERVED_PACKAGE_PREFIXES.includes(segments[0]!)) {
    throw new ValidationError(`package may not start with "${segments[0]}."`);
  }
  for (const seg of segments) {
    if (!PACKAGE_SEGMENT.test(seg)) {
      throw new ValidationError(
        `package segment "${seg}" must be lowercase, start with a letter, and contain only [a-z0-9_]`,
      );
    }
    if (JAVA_RESERVED_KEYWORDS.has(seg)) {
      throw new ValidationError(`package segment "${seg}" is a Java reserved keyword`);
    }
  }
  return input;
}

export function validateArch(input: string): "multi" | "single" {
  if (input === "multi" || input === "single") return input;
  throw new ValidationError(`arch must be "multi" or "single" (got "${input}")`);
}
