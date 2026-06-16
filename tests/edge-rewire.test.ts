import { describe, expect, it } from "vitest";
import type { Edge } from "@xyflow/react";
import type { InternalNode } from "@xyflow/react";
import {
  buildRewireConnection,
  getJackCenter,
  getRewireAnchor,
  pickFreeEnd,
} from "@/lib/patch/edge-rewire";

const edge: Edge = {
  id: "e1",
  source: "osc",
  target: "out",
  sourceHandle: "audio-out",
  targetHandle: "audio-in",
};

function mockNode(
  id: string,
  handles: {
    source?: { id: string; x: number; y: number };
    target?: { id: string; x: number; y: number };
  }
): InternalNode {
  const toBounds = (h: { id: string; x: number; y: number }) => ({
    id: h.id,
    type: "source" as const,
    nodeId: id,
    position: "bottom",
    x: h.x,
    y: h.y,
    width: 36,
    height: 36,
  });

  return {
    id,
    internals: {
      handleBounds: {
        source: handles.source ? [toBounds(handles.source)] : [],
        target: handles.target
          ? [{ ...toBounds(handles.target), type: "target" as const }]
          : [],
      },
    },
  } as unknown as InternalNode;
}

describe("pickFreeEnd", () => {
  it("frees the jack closest to the double-click", () => {
    const lookup = new Map<string, InternalNode>([
      ["osc", mockNode("osc", { source: { id: "audio-out", x: 100, y: 200 } })],
      ["out", mockNode("out", { target: { id: "audio-in", x: 400, y: 200 } })],
    ]);
    const getNode = (id: string) => lookup.get(id);

    expect(pickFreeEnd(edge, 120, 218, getNode)).toBe("source");
    expect(pickFreeEnd(edge, 380, 218, getNode)).toBe("target");
  });
});

describe("getRewireAnchor", () => {
  it("keeps the opposite jack when freeing source", () => {
    expect(getRewireAnchor(edge, "source")).toEqual({
      nodeId: "out",
      handleId: "audio-in",
      handleType: "target",
    });
  });
});

describe("buildRewireConnection", () => {
  it("wires anchored source to a new target jack", () => {
    const draft = {
      nodeId: "osc",
      handleId: "audio-out",
      handleType: "source" as const,
      signal: "audio" as const,
      freeEnd: "target" as const,
    };
    expect(
      buildRewireConnection(draft, {
        nodeId: "out",
        handleId: "audio-in",
        handleType: "target",
      })
    ).toEqual({
      source: "osc",
      sourceHandle: "audio-out",
      target: "out",
      targetHandle: "audio-in",
    });
  });

  it("rejects same handle type as anchor", () => {
    const draft = {
      nodeId: "osc",
      handleId: "audio-out",
      handleType: "source" as const,
      signal: "audio" as const,
      freeEnd: "target" as const,
    };
    expect(
      buildRewireConnection(draft, {
        nodeId: "vco2",
        handleId: "audio-out",
        handleType: "source",
      })
    ).toBeNull();
  });
});

describe("getJackCenter", () => {
  it("returns center of handle bounds", () => {
    const node = mockNode("osc", { source: { id: "audio-out", x: 100, y: 200 } });
    expect(getJackCenter(node, "audio-out", "source")).toEqual({ x: 118, y: 218 });
  });
});
