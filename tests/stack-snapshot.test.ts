import { describe, expect, test } from "bun:test";
import { loadSnapshot, formatSnapshotBanner } from "../src/stack/snapshot";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("snapshot", () => {
  test("loadSnapshot reads stack/snapshot.json relative to repo root", async () => {
    const snap = await loadSnapshot(repoRoot);
    expect(snap.agp).toBe("9.1.1");
    expect(snap.kotlin).toBe("2.4.0");
    expect(snap.compileSdk).toBe(37);
    expect(snap.targetSdk).toBe(37);
    expect(snap.ndk).toBe("29.0.14206865");
  });

  test("formatSnapshotBanner contains all version fields", () => {
    const snap = {
      agp: "9.1.1",
      kotlin: "2.4.0",
      gradle: "9.5.1",
      compileSdk: 37,
      targetSdk: 37,
      minSdk: 24,
      ndk: "29.0.14206865",
      composeBom: "2026.05.00",
      hilt: "2.55",
    };
    const banner = formatSnapshotBanner(snap);
    expect(banner).toContain("AGP 9.1.1");
    expect(banner).toContain("Kotlin 2.4.0");
    expect(banner).toContain("Gradle 9.5.1");
    expect(banner).toContain("compileSdk 37");
    expect(banner).toContain("targetSdk 37");
  });

  test("formatSnapshotBanner is stable (deterministic ordering)", () => {
    const snap = {
      agp: "9.1.1",
      kotlin: "2.4.0",
      gradle: "9.5.1",
      compileSdk: 37,
      targetSdk: 37,
      minSdk: 24,
      ndk: "29.0.14206865",
      composeBom: "2026.05.00",
      hilt: "2.55",
    };
    const a = formatSnapshotBanner(snap);
    const b = formatSnapshotBanner(snap);
    expect(a).toBe(b);
  });
});
