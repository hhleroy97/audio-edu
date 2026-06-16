import { describe, expect, it } from "vitest";
import { hasAudioPath } from "@/lib/patch/tour-utils";

describe("detune pipeline paths", () => {
  it("detects osc → detune → output chain", () => {
    const edges = [
      { source: "osc-1", target: "det-1" },
      { source: "det-1", target: "out-1" },
    ];
    expect(hasAudioPath(edges, "osc-1", "out-1")).toBe(true);
  });

  it("fails when detune is bypassed", () => {
    const edges = [{ source: "osc-1", target: "out-1" }];
    expect(hasAudioPath(edges, "osc-1", "out-1")).toBe(true);
    expect(hasAudioPath([], "osc-1", "out-1")).toBe(false);
  });
});
