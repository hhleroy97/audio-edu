import { describe, expect, it } from "vitest";
import {
  findNonOverlappingPosition,
  hasAnyOverlap,
  resolveNodeCollisions,
} from "@/lib/patch/collision-layout";
import { getNodeDimensions } from "@/lib/patch/node-layout";

describe("resolveNodeCollisions", () => {
  it("leaves non-overlapping nodes at their original positions", () => {
    const nodes = [
      { id: "a", kind: "oscillator" as const, x: 64, y: 80 },
      { id: "b", kind: "output" as const, x: 500, y: 80 },
    ];

    const resolved = resolveNodeCollisions(nodes);
    expect(resolved.get("a")).toEqual({ x: 64, y: 80 });
    expect(resolved.get("b")).toEqual({ x: 500, y: 80 });
  });

  it("pushes overlapping nodes apart while pinning untouched nodes", () => {
    const nodes = [
      { id: "a", kind: "oscillator" as const, x: 64, y: 80 },
      { id: "b", kind: "detune" as const, x: 120, y: 80 },
      { id: "c", kind: "output" as const, x: 900, y: 80 },
    ];

    const resolved = resolveNodeCollisions(nodes);
    const a = resolved.get("a")!;
    const b = resolved.get("b")!;
    const c = resolved.get("c")!;

    expect(c).toEqual({ x: 900, y: 80 });
    const minGap = getNodeDimensions("oscillator").width;
    expect(b.x - a.x).toBeGreaterThanOrEqual(minGap);
  });

  it("only moves the newcomer when existing nodes are pinned", () => {
    const existing = [
      { id: "a", kind: "oscillator" as const, x: 64, y: 80 },
      { id: "b", kind: "output" as const, x: 400, y: 80 },
    ];
    const next = findNonOverlappingPosition("filter", { x: 100, y: 80 }, existing);

    expect(next.x).not.toBe(100);
    expect(
      hasAnyOverlap([
        ...existing,
        { id: "new", kind: "filter", x: next.x, y: next.y },
      ])
    ).toBe(false);
  });
});

describe("findNonOverlappingPosition", () => {
  it("returns the seed when nothing overlaps", () => {
    const existing = [{ id: "a", kind: "oscillator" as const, x: 64, y: 80 }];
    const next = findNonOverlappingPosition("output", { x: 512, y: 80 }, existing);
    expect(next).toEqual({ x: 512, y: 80 });
  });

  it("nudges a seed position that would overlap", () => {
    const existing = [{ id: "a", kind: "oscillator" as const, x: 64, y: 80 }];
    const next = findNonOverlappingPosition("detune", { x: 100, y: 80 }, existing);
    const oscWidth = getNodeDimensions("oscillator").width;
    expect(next.x).toBeGreaterThan(64 + oscWidth - 1);
    expect(
      hasAnyOverlap([
        ...existing,
        { id: "new", kind: "detune", x: next.x, y: next.y },
      ])
    ).toBe(false);
  });
});

describe("hasAnyOverlap", () => {
  it("detects horizontal overlap", () => {
    const nodes = [
      { id: "a", kind: "oscillator" as const, x: 64, y: 80 },
      { id: "b", kind: "output" as const, x: 200, y: 80 },
    ];
    expect(hasAnyOverlap(nodes)).toBe(true);
  });

  it("returns false when boxes only touch with padding", () => {
    const oscWidth = getNodeDimensions("oscillator").width;
    const nodes = [
      { id: "a", kind: "oscillator" as const, x: 64, y: 80 },
      {
        id: "b",
        kind: "output" as const,
        x: 64 + oscWidth + 16,
        y: 80,
      },
    ];
    expect(hasAnyOverlap(nodes)).toBe(false);
  });
});
