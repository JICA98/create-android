import { describe, expect, test, spyOn, beforeEach, afterEach } from "bun:test";
import { log, ok, err, warn, header } from "../src/util/logger";

describe("logger", () => {
  let stdoutSpy: ReturnType<typeof spyOn>;
  let stderrSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stdoutSpy = spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  test("log writes to stdout without a symbol", () => {
    log("hello");
    expect(stdoutSpy).toHaveBeenCalledWith("hello\n");
  });

  test("ok writes a checkmark + message to stdout", () => {
    ok("done");
    expect(stdoutSpy).toHaveBeenCalledWith("✔ done\n");
  });

  test("err writes a cross + message to stderr", () => {
    err("boom");
    expect(stderrSpy).toHaveBeenCalledWith("✖ boom\n");
  });

  test("warn writes a leading '!' + message to stderr", () => {
    warn("careful");
    expect(stderrSpy).toHaveBeenCalledWith("! careful\n");
  });

  test("header writes a dim label to stdout containing the text", () => {
    header("Stack: ...");
    const firstCall = stdoutSpy.mock.calls[0]?.[0] as string;
    expect(firstCall).toContain("Stack: ...");
  });
});
