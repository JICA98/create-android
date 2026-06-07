import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { renderTemplate } from "../src/scaffold/render";
import { loadSnapshot } from "../src/stack/snapshot";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = join(repoRoot, "templates", "single");

let out: string;
beforeEach(async () => {
  out = await mkdtemp(join(tmpdir(), "smoke-"));
});
afterEach(async () => {
  await rm(out, { recursive: true, force: true });
});

describe("single template smoke render", () => {
  test("renders the whole tree with token substitution", async () => {
    const snap = await loadSnapshot(repoRoot);
    const tokens = {
      name: "DemoApp",
      package: "com.example.demo",
      packagePath: "com/example/demo",
      packageNamespace: "com.example",
      packageName: "demo",
      agp: snap.agp,
      kotlin: snap.kotlin,
      gradle: snap.gradle,
      compileSdk: String(snap.compileSdk),
      targetSdk: String(snap.targetSdk),
      minSdk: String(snap.minSdk),
      ndk: snap.ndk,
    } as unknown as Parameters<typeof renderTemplate>[0]["tokens"];

    await renderTemplate({ templateRoot, outDir: out, tokens });

    const root = join(out, "DemoApp");
    expect((await stat(root)).isDirectory()).toBe(true);
    const settings = await readFile(join(root, "settings.gradle.kts"), "utf8");
    expect(settings).toContain('rootProject.name = "DemoApp"');
    expect(settings).not.toContain("{{name}}");

    const manifest = await readFile(
      join(root, "app", "src", "main", "AndroidManifest.xml"),
      "utf8",
    );
    expect(manifest).toContain("DemoApp");

    const kt = await readFile(
      join(root, "app", "src", "main", "kotlin", "com", "example", "demo", "MainActivity.kt"),
      "utf8",
    );
    expect(kt).toContain("package com.example.demo");
    expect(kt).not.toContain("{{package}}");
  });
});

describe("multi template smoke render", () => {
  test("renders the multi-arch tree", async () => {
    const out2 = await mkdtemp(join(tmpdir(), "smoke-multi-"));
    try {
      const snap = await loadSnapshot(repoRoot);
      const tokens = {
        name: "DemoApp",
        package: "com.example.demo",
        packagePath: "com/example/demo",
        packageNamespace: "com.example",
        packageName: "demo",
        agp: snap.agp,
        kotlin: snap.kotlin,
        gradle: snap.gradle,
        compileSdk: String(snap.compileSdk),
        targetSdk: String(snap.targetSdk),
        minSdk: String(snap.minSdk),
        ndk: snap.ndk,
      } as Parameters<typeof renderTemplate>[0]["tokens"];
      const multiRoot = join(repoRoot, "templates", "multi");
      await renderTemplate({ templateRoot: multiRoot, outDir: out2, tokens });
      const root = join(out2, "DemoApp");
      expect((await stat(root)).isDirectory()).toBe(true);
      const settings = await readFile(join(root, "settings.gradle.kts"), "utf8");
      expect(settings).toContain('include(":app")');
      expect(settings).toContain('include(":feature:home")');
      const appKt = await readFile(
        join(root, "app", "src", "main", "kotlin", "com", "example", "demo", "MainActivity.kt"),
        "utf8",
      );
      expect(appKt).toContain("package com.example.demo");
      const homeKt = await readFile(
        join(
          root,
          "feature",
          "home",
          "src",
          "main",
          "kotlin",
          "com",
          "example",
          "demo",
          "feature",
          "home",
          "HomeRoute.kt",
        ),
        "utf8",
      );
      expect(homeKt).toContain("com.example.demo.feature.home");
    } finally {
      await rm(out2, { recursive: true, force: true });
    }
  });
});
