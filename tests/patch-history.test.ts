import { describe, expect, it } from "vitest";
import {
  cloneGraph,
  isUndoableEdgeChange,
  isUndoableNodeChange,
} from "@/lib/patch/history";

describe("patch history", () => {
  it("clones graph without selection state", () => {
    const snap = cloneGraph(
      [
        {
          id: "a",
          type: "oscillator",
          position: { x: 0, y: 0 },
          selected: true,
          data: {
            label: "Osc",
            kind: "oscillator",
            params: { frequency: 220 },
          },
        },
      ],
      [{ id: "e1", source: "a", target: "b", selected: true }]
    );
    expect(snap.nodes[0].selected).toBe(false);
    expect(snap.edges[0].selected).toBe(false);
    expect(snap.nodes[0].data.params.frequency).toBe(220);
  });

  it("ignores selection-only node changes for undo", () => {
    expect(isUndoableNodeChange([{ type: "select" }])).toBe(false);
    expect(isUndoableNodeChange([{ type: "position" }])).toBe(false);
    expect(isUndoableNodeChange([{ type: "remove" }])).toBe(true);
  });

  it("tracks structural edge changes for undo", () => {
    expect(isUndoableEdgeChange([{ type: "select" }])).toBe(false);
    expect(isUndoableEdgeChange([{ type: "add" }])).toBe(true);
  });
});
