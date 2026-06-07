import { describe, expect, test } from "bun:test";
import { deriveTokens, applyContentTokens, tokenKeys } from "../src/scaffold/tokens";

describe("deriveTokens", () => {
  test("derives name, package, packagePath, namespace, packageName", () => {
    const t = deriveTokens({ name: "MyApp", package: "com.flux.coolapp" });
    expect(t.name).toBe("MyApp");
    expect(t.package).toBe("com.flux.coolapp");
    expect(t.packagePath).toBe("com/flux/coolapp");
    expect(t.packageNamespace).toBe("com.flux");
    expect(t.packageName).toBe("coolapp");
  });

  test("two-segment package gives namespace equal to first segment", () => {
    const t = deriveTokens({ name: "X", package: "com.example" });
    expect(t.packageNamespace).toBe("com");
    expect(t.packageName).toBe("example");
  });
});

describe("applyContentTokens", () => {
  test("replaces every {{var}} placeholder with its value", () => {
    const out = applyContentTokens("hi {{name}} from {{package}}", {
      name: "App",
      package: "com.x",
      packagePath: "com/x",
      packageNamespace: "com",
      packageName: "x",
    });
    expect(out).toBe("hi App from com.x");
  });

  test("leaves text without tokens unchanged", () => {
    const out = applyContentTokens("plain text", {
      name: "A",
      package: "b",
      packagePath: "b",
      packageNamespace: "",
      packageName: "b",
    });
    expect(out).toBe("plain text");
  });

  test("does not re-replace tokens introduced by a previous replacement", () => {
    const out = applyContentTokens("{{name}}", {
      name: "{{package}}",
      package: "b",
      packagePath: "b",
      packageNamespace: "",
      packageName: "b",
    });
    // First-pass replaces {{name}} with literal "{{package}}"; the second pass
    // would only re-run if we iterated, which we don't. Result is the literal.
    expect(out).toBe("{{package}}");
  });
});

describe("tokenKeys", () => {
  test("returns the five canonical token names in stable order", () => {
    expect(tokenKeys).toEqual([
      "name",
      "package",
      "packagePath",
      "packageNamespace",
      "packageName",
    ]);
  });
});
