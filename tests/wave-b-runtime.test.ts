import { describe, expect, it } from "vitest";
import {
  DEFAULT_LFO_CURVE,
  encodeCurvePoints,
  parseCurvePoints,
  sampleCurveAt,
} from "@/lib/patch/lfo-curve";
import { listCvModRoutes } from "@/lib/patch/mod-matrix";
import type { Edge, Node } from "@xyflow/react";
import type { PatchNodeData } from "@/lib/patch/ports";
import { getFormantVowel, FORMANT_VOWELS } from "@/lib/patch/formant-presets";

describe("lfo curve", () => {
  it("parses and encodes control points", () => {
    const points = parseCurvePoints(DEFAULT_LFO_CURVE);
    expect(points.length).toBeGreaterThanOrEqual(2);
    expect(points[0].x).toBe(0);
    expect(points[points.length - 1].x).toBe(1);
    const encoded = encodeCurvePoints(points);
    expect(encoded).toContain(":");
  });

  it("samples piecewise curve", () => {
    const points = [
      { x: 0, y: 1 },
      { x: 0.5, y: 0 },
      { x: 1, y: 1 },
    ];
    expect(sampleCurveAt(points, 0)).toBeCloseTo(1);
    expect(sampleCurveAt(points, 0.25)).toBeCloseTo(0.5);
    expect(sampleCurveAt(points, 0.75)).toBeCloseTo(0.5);
  });
});

describe("mod matrix", () => {
  it("lists CV routes with depth", () => {
    const nodes: Node<PatchNodeData>[] = [
      {
        id: "lfo-1",
        type: "lfo",
        position: { x: 0, y: 0 },
        data: { label: "LFO", kind: "lfo", params: {} },
      },
      {
        id: "filt-1",
        type: "filter",
        position: { x: 0, y: 0 },
        data: { label: "Filter", kind: "filter", params: {} },
      },
    ];
    const edges: Edge[] = [
      {
        id: "e1",
        source: "lfo-1",
        target: "filt-1",
        sourceHandle: "cv-out",
        targetHandle: "cv-cutoff",
        data: { signal: "cv", modDepth: 0.65 },
      },
    ];
    const routes = listCvModRoutes(nodes, edges);
    expect(routes).toHaveLength(1);
    expect(routes[0].depth).toBe(0.65);
    expect(routes[0].sourceCode).toBe("LFO");
    expect(routes[0].targetCode).toBe("VCF");
  });
});

describe("formant presets", () => {
  it("resolves vowel formants", () => {
    expect(FORMANT_VOWELS).toHaveLength(4);
    const o = getFormantVowel("o");
    expect(o.freqs[0]).toBeGreaterThan(0);
    expect(getFormantVowel("unknown").id).toBe("a");
  });
});
