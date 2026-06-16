import { describe, expect, it } from "vitest";
import {
  layoutPatchGraph,
  suggestNodePosition,
} from "@/lib/patch/layout";
import { getNodeDimensions } from "@/lib/patch/node-layout";
import { hasAnyOverlap } from "@/lib/patch/collision-layout";
import {
  layoutLessonPatch,
  signalChainOrder,
} from "@/lib/patch/lesson-chain";
import { LESSONS } from "@/lib/patch/lessons/index";

function patchDef(lesson: (typeof LESSONS)[number]) {
  const patch = lesson.startingPatch!;
  const nodes = patch.nodes.map((n) => ({
    id: n.id,
    kind: n.type as Parameters<typeof layoutPatchGraph>[0][number]["kind"],
  }));
  const edges = patch.edges.map((e) => ({
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  }));
  return {
    nodes,
    edges,
    positions: layoutPatchGraph(nodes, edges),
  };
}

describe("layoutPatchGraph — all lesson chains", () => {
  it.each(LESSONS.map((lesson) => [lesson.slug, lesson] as const))(
    "%s lays out left-to-right without horizontal overlap",
    (slug, lesson) => {
      const patch = lesson.startingPatch;
      expect(patch).toBeDefined();

      const { positions, nodes } = patchDef(lesson);
      const chain = signalChainOrder({
        nodes: patch!.nodes.map(({ position: _position, ...node }) => node),
        edges: patch!.edges,
      });

      expect(chain.length).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < chain.length - 1; i++) {
        const leftId = chain[i]!;
        const rightId = chain[i + 1]!;
        const left = positions.get(leftId)!;
        const right = positions.get(rightId)!;
        const leftNode = nodes.find((n) => n.id === leftId)!;
        const leftWidth = getNodeDimensions(leftNode.kind).width;
        expect(right.x).toBeGreaterThanOrEqual(left.x + leftWidth);
        expect(right.x).toBeGreaterThan(left.x);
      }
    }
  );

  it.each(LESSONS.map((lesson) => [lesson.slug, lesson] as const))(
    "%s has no bounding-box overlap after layout",
    (_slug, lesson) => {
      const { positions, nodes } = patchDef(lesson);
      const positioned = nodes.map((n) => ({
        ...n,
        x: positions.get(n.id)!.x,
        y: positions.get(n.id)!.y,
      }));
      expect(hasAnyOverlap(positioned)).toBe(false);
    }
  );

  it.each(LESSONS.map((lesson) => [lesson.slug, lesson] as const))(
    "%s stores laid-out positions and layout metadata on startingPatch",
    (_slug, lesson) => {
      const patch = lesson.startingPatch!;
      for (const node of patch.nodes) {
        expect(node.position.x).toBeGreaterThan(0);
        expect(node.position.y).toBeGreaterThanOrEqual(0);
        expect(node.layout?.width).toBeGreaterThan(0);
        expect(node.layout?.height).toBeGreaterThan(0);
      }
    }
  );
});

describe("layoutPatchGraph — chain shapes", () => {
  it("keeps in-series analyser inline on the main row (lesson 01)", () => {
    const patch = LESSONS[0]!.startingPatch!;
    const positions = layoutPatchGraph(
      patch.nodes.map((n) => ({
        id: n.id,
        kind: n.type as "oscillator" | "analyser" | "output",
      })),
      patch.edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }))
    );

    const osc = positions.get("osc-1")!;
    const ana = positions.get("ana-1")!;
    const out = positions.get("out-1")!;

    expect(ana.y).toBe(osc.y);
    expect(ana.y).toBe(out.y);
    expect(ana.x).toBeGreaterThan(osc.x);
    expect(out.x).toBeGreaterThan(ana.x);
  });

  it("places branch-only analyser taps above the main signal row", () => {
    const nodes = [
      { id: "osc-1", kind: "oscillator" as const },
      { id: "ana-1", kind: "analyser" as const },
      { id: "det-1", kind: "detune" as const },
      { id: "out-1", kind: "output" as const },
    ];
    const edges = [
      {
        source: "osc-1",
        target: "ana-1",
        sourceHandle: "audio-out",
        targetHandle: "audio-in",
      },
      {
        source: "osc-1",
        target: "det-1",
        sourceHandle: "audio-out",
        targetHandle: "audio-in",
      },
      {
        source: "det-1",
        target: "out-1",
        sourceHandle: "audio-out",
        targetHandle: "audio-in",
      },
    ];

    const positions = layoutPatchGraph(nodes, edges);
    const ana = positions.get("ana-1")!;
    const det = positions.get("det-1")!;

    expect(ana.y).toBeLessThan(det.y);
    expect(ana.x).toBeLessThan(det.x);
  });

  it("stacks parallel sources in the same stage horizontally", () => {
    const nodes = [
      { id: "osc-a", kind: "oscillator" as const },
      { id: "osc-b", kind: "oscillator" as const },
      { id: "out-1", kind: "output" as const },
    ];
    const edges = [
      {
        source: "osc-a",
        target: "out-1",
        sourceHandle: "audio-out",
        targetHandle: "audio-in",
      },
      {
        source: "osc-b",
        target: "out-1",
        sourceHandle: "audio-out",
        targetHandle: "audio-in",
      },
    ];

    const positions = layoutPatchGraph(nodes, edges);
    const oscA = positions.get("osc-a")!;
    const oscB = positions.get("osc-b")!;
    const oscWidth = getNodeDimensions("oscillator").width;

    expect(oscA.y).toBe(oscB.y);
    expect(oscB.x).toBeGreaterThan(oscA.x + oscWidth - 1);
  });
});

describe("layoutLessonPatch", () => {
  it("assigns unique positions and layout metadata for every node", () => {
    const patch = layoutLessonPatch({
      nodes: [
        { id: "osc-1", type: "oscillator", params: { waveform: "sine", frequency: 220, gain: 1 } },
        { id: "out-1", type: "output", params: { gain: 0.8 } },
      ],
      edges: [
        {
          id: "e1",
          source: "osc-1",
          sourceHandle: "audio-out",
          target: "out-1",
          targetHandle: "audio-in",
          signal: "audio",
        },
      ],
    });

    const coords = patch.nodes.map((n) => `${n.position.x},${n.position.y}`);
    expect(new Set(coords).size).toBe(patch.nodes.length);
    for (const node of patch.nodes) {
      expect(node.layout?.width).toBeGreaterThan(0);
      expect(node.layout?.height).toBeGreaterThan(0);
    }
  });
});

describe("suggestNodePosition", () => {
  it("places disconnected palette nodes to the right of the existing graph", () => {
    const nodes = [{ id: "osc-1", kind: "oscillator" as const }];
    const edges: { source: string; target: string }[] = [];
    const positions = new Map([["osc-1", { x: 64, y: 80 }]]);
    const position = suggestNodePosition(
      "filter",
      nodes,
      edges,
      "filter-new",
      positions
    );

    const oscWidth = getNodeDimensions("oscillator").width;
    expect(position.x).toBeGreaterThan(64 + oscWidth);
  });
});
