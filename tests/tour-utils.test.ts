import { describe, expect, it } from "vitest";
import { hasAudioPath, isDoStepSatisfied } from "@/lib/patch/tour-utils";

describe("tour-utils", () => {
  it("detects audio path through intermediate nodes", () => {
    const edges = [
      { source: "osc-1", target: "ana-1" },
      { source: "ana-1", target: "out-1" },
    ];
    expect(hasAudioPath(edges, "osc-1", "out-1")).toBe(true);
    expect(hasAudioPath(edges, "out-1", "osc-1")).toBe(false);
  });

  it("satisfies do step when path exists", () => {
    const step = {
      id: "do-connect",
      kind: "do" as const,
      content: "wire it",
      requires: { edge: { from: "osc-1", to: "out-1" } },
    };
    const edges = [
      { source: "osc-1", target: "ana-1" },
      { source: "ana-1", target: "out-1" },
    ];
    expect(isDoStepSatisfied(step, edges)).toBe(true);
  });
});
