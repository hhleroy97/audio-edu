import { describe, expect, it } from "vitest";
import {
  isScopeTappable,
  listScopeTapCandidates,
  resolveDefaultScopeTapId,
} from "@/lib/patch/scope-tap";
import type { PatchNodeData } from "@/lib/patch/ports";
import type { Node } from "@xyflow/react";

function flowNode(
  id: string,
  kind: PatchNodeData["kind"],
  label?: string
): Node<PatchNodeData> {
  return {
    id,
    type: kind,
    position: { x: 0, y: 0 },
    data: { label: label ?? kind, kind, params: {} },
  };
}

describe("scope tap", () => {
  it("lists tappable audio nodes", () => {
    const nodes = [
      flowNode("osc-1", "oscillator"),
      flowNode("lfo-1", "lfo"),
      flowNode("out-1", "output"),
    ];
    const candidates = listScopeTapCandidates(nodes);
    expect(candidates.map((c) => c.id)).toEqual(["osc-1", "out-1"]);
    expect(isScopeTappable("lfo")).toBe(false);
    expect(isScopeTappable("filter")).toBe(true);
  });

  it("defaults to analyser then output", () => {
    const withAnalyser = [
      flowNode("osc-1", "oscillator"),
      flowNode("ana-1", "analyser"),
      flowNode("out-1", "output"),
    ];
    expect(resolveDefaultScopeTapId(withAnalyser)).toBe("ana-1");

    const withoutAnalyser = [
      flowNode("osc-1", "oscillator"),
      flowNode("out-1", "output"),
    ];
    expect(resolveDefaultScopeTapId(withoutAnalyser)).toBe("out-1");
  });
});
