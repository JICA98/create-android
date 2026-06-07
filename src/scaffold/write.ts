import {
  writeFile as fsWriteFile,
  mkdir,
  rm,
  stat,
} from "node:fs/promises";
import { dirname } from "node:path";

export async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}

export async function writeFile(p: string, content: string): Promise<void> {
  await ensureDir(dirname(p));
  await fsWriteFile(p, content, "utf8");
}

export async function writeBinaryFile(p: string, content: Buffer): Promise<void> {
  await ensureDir(dirname(p));
  await fsWriteFile(p, content);
}

export async function removeTree(p: string): Promise<void> {
  try {
    await stat(p);
  } catch {
    return;
  }
  await rm(p, { recursive: true, force: true });
}
