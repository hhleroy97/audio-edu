import { describe, expect, it } from "vitest";
import { ConnectionRegistry } from "@/lib/patch/connection-registry";
import { parseHandle, isSourceHandle, isTargetHandle } from "@/lib/patch/ports";

describe("ConnectionRegistry", () => {
  it("detects cycles", () => {
    const reg = new ConnectionRegistry();
    reg.register("a", "b");
    reg.register("b", "c");
    expect(reg.wouldCycle("c", "a")).toBe(true);
    expect(reg.wouldCycle("a", "d")).toBe(false);
  });
});

describe("port handles", () => {
  it("parses audio handles", () => {
    expect(parseHandle("audio-out")).toEqual({ signal: "audio", role: "out" });
    expect(parseHandle("cv-freq")).toEqual({ signal: "cv", role: "freq" });
    expect(isSourceHandle("audio-out")).toBe(true);
    expect(isTargetHandle("audio-in")).toBe(true);
  });
});
