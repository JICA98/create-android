import { text, select, isCancel } from "@clack/prompts";
import { resolve } from "node:path";

export type InteractiveAnswers = {
  projectDir: string;
  name: string;
  package: string;
  arch: "multi" | "single";
};

export type CollectOpts = {
  provided: Partial<InteractiveAnswers>;
  isTTY: boolean;
  cwd?: string;
};

export async function collectInteractiveInputs(
  opts: CollectOpts,
): Promise<InteractiveAnswers> {
  const { provided, isTTY } = opts;
  const cwd = opts.cwd ?? process.cwd();

  const missing: string[] = [];
  if (provided.projectDir === undefined) missing.push("--projectDir");
  if (provided.name === undefined) missing.push("--name");
  if (provided.package === undefined) missing.push("--package");
  if (provided.arch === undefined) missing.push("--arch");

  if (missing.length > 0) {
    if (!isTTY) {
      throw new Error(
        `Missing required input: ${missing.join(", ")}. Re-run in a TTY or pass them as flags.`,
      );
    }
    if (provided.projectDir === undefined) {
      const def = "./" + (provided.name ?? "MyApp");
      const v = await text({ message: "Where should we create the project?", defaultValue: def });
      if (isCancel(v)) throw new Error("aborted");
      provided.projectDir = v as string;
    }
    if (provided.name === undefined) {
      const defaultName = provided.projectDir!.split("/").filter(Boolean).pop() ?? "MyApp";
      const pascal = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      const v = await text({ message: "App name?", defaultValue: pascal });
      if (isCancel(v)) throw new Error("aborted");
      provided.name = v as string;
    }
    if (provided.package === undefined) {
      const guess = "com.example." + (provided.name!.toLowerCase().replace(/[^a-z0-9]/g, ""));
      const v = await text({ message: "Android application id?", defaultValue: guess });
      if (isCancel(v)) throw new Error("aborted");
      provided.package = v as string;
    }
    if (provided.arch === undefined) {
      const v = await select({
        message: "Architecture?",
        options: [
          { value: "multi", label: "multi", hint: "NowInAndroid-style multi-module project" },
          { value: "single", label: "single", hint: "Single module with feature folders" },
        ],
      });
      if (isCancel(v)) throw new Error("aborted");
      provided.arch = v as "multi" | "single";
    }
  }

  const projectDir = resolve(cwd, provided.projectDir!);
  return {
    projectDir,
    name: provided.name!,
    package: provided.package!,
    arch: provided.arch!,
  };
}
