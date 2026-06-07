import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { collectInteractiveInputs, type InteractiveAnswers } from "../src/prompts";

describe("collectInteractiveInputs", () => {
  test("uses provided answers when no prompt is needed (all provided)", async () => {
    const answers: Partial<InteractiveAnswers> = {
      projectDir: "./MyApp",
      name: "MyApp",
      package: "com.x",
      arch: "multi",
    };
    const out = await collectInteractiveInputs({
      provided: answers,
      isTTY: true,
    });
    // projectDir is resolved to an absolute path; only check the suffix.
    expect(out.projectDir.endsWith("/MyApp")).toBe(true);
    expect(out.name).toBe("MyApp");
    expect(out.package).toBe("com.x");
    expect(out.arch).toBe("multi");
  });

  test("throws when isTTY is false and a required input is missing", async () => {
    await expect(
      collectInteractiveInputs({ provided: { arch: "multi" }, isTTY: false }),
    ).rejects.toThrow(/--name|--package|--arch/);
  });

  test("returns provided + prompt-resolved inputs merged", async () => {
    // Mock @clack/prompts so the test does not require a TTY.
    mock.module("@clack/prompts", () => ({
      text: async () => "PromptedValue",
      select: async () => "single",
      isCancel: () => false,
    }));
    // Re-import after mock.
    const { collectInteractiveInputs: run } = await import("../src/prompts");
    const out = await run({
      provided: { name: "Pre" },
      isTTY: true,
      cwd: "/tmp",
    });
    expect(out.name).toBe("Pre");
    expect(out.arch).toBe("single");
  });
});
