import { describe, expect, test } from "bun:test";
import {
  validateName,
  validatePackage,
  validateArch,
  RESERVED_NAMES,
} from "../src/prompts-validate";

describe("validateName", () => {
  test("accepts PascalCase identifiers", () => {
    expect(validateName("MyApp")).toBe("MyApp");
    expect(validateName("App2")).toBe("App2");
  });

  test("rejects names with hyphens or underscores", () => {
    expect(() => validateName("My-App")).toThrow();
    expect(() => validateName("My_App")).toThrow();
  });

  test("rejects names starting with a digit", () => {
    expect(() => validateName("2App")).toThrow();
  });

  test("rejects empty names", () => {
    expect(() => validateName("")).toThrow();
  });

  test("rejects reserved Gradle module names", () => {
    for (const r of RESERVED_NAMES) {
      expect(() => validateName(r)).toThrow();
    }
  });
});

describe("validatePackage", () => {
  test("accepts lowercase dotted ids with at least 2 segments", () => {
    expect(validatePackage("com.flux.app")).toBe("com.flux.app");
    expect(validatePackage("io.example.cool")).toBe("io.example.cool");
  });

  test("rejects single-segment packages", () => {
    expect(() => validatePackage("app")).toThrow();
  });

  test("rejects uppercase or hyphenated segments", () => {
    expect(() => validatePackage("com.Flux.app")).toThrow();
    expect(() => validatePackage("com.flux-app.x")).toThrow();
  });

  test("rejects packages starting with reserved java/javax/kotlin/android", () => {
    expect(() => validatePackage("java.foo")).toThrow();
    expect(() => validatePackage("javax.foo")).toThrow();
    expect(() => validatePackage("kotlin.foo")).toThrow();
    expect(() => validatePackage("android.foo")).toThrow();
  });

  test("rejects segments that are Java reserved keywords", () => {
    expect(() => validatePackage("com.class.app")).toThrow();
    expect(() => validatePackage("com.if.app")).toThrow();
  });
});

describe("validateArch", () => {
  test("accepts multi and single", () => {
    expect(validateArch("multi")).toBe("multi");
    expect(validateArch("single")).toBe("single");
  });
  test("rejects anything else", () => {
    expect(() => validateArch("double")).toThrow();
    expect(() => validateArch("")).toThrow();
  });
});
