import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type Snapshot = {
  agp: string;
  kotlin: string;
  gradle: string;
  compileSdk: number;
  targetSdk: number;
  minSdk: number;
  ndk: string;
  composeBom: string;
  hilt: string;
  notes?: string;
};

export async function loadSnapshot(repoRoot: string): Promise<Snapshot> {
  const path = resolve(repoRoot, "stack/snapshot.json");
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as Snapshot;
}

export function formatSnapshotBanner(s: Snapshot): string {
  // Order is fixed for determinism.
  return [
    `AGP ${s.agp}`,
    `Kotlin ${s.kotlin}`,
    `Gradle ${s.gradle}`,
    `compileSdk ${s.compileSdk}`,
    `targetSdk ${s.targetSdk}`,
    `minSdk ${s.minSdk}`,
    `NDK ${s.ndk}`,
  ].join(" · ");
}
