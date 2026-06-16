import { describe, expect, it } from "vitest";
import type { Edge, Node } from "@xyflow/react";
import {
  getSubProtectedSourceIds,
  isSubCvConnectionBlocked,
} from "@/lib/patch/sub-protection";
import type { PatchNodeData } from "@/lib/patch/ports";
import { createRuntimeNode } from "@/lib/patch/runtime-nodes";
import { buildWaveshaperCurve } from "@/lib/patch/waveshaper-curves";

function node(id: string, kind: PatchNodeData["kind"]): Node<PatchNodeData> {
  return {
    id,
    type: kind,
    position: { x: 0, y: 0 },
    data: { label: kind, kind, params: {} },
  };
}

describe("sub protection", () => {
  it("protects sources wired to layerStack sub input", () => {
    const nodes = [node("osc-sub", "oscillator"), node("stack-1", "layerStack")];
    const edges: Edge[] = [
      {
        id: "e1",
        source: "osc-sub",
        target: "stack-1",
        targetHandle: "audio-in-sub",
        sourceHandle: "audio-out",
      },
    ];
    const protectedIds = getSubProtectedSourceIds(nodes, edges);
    expect(protectedIds.has("osc-sub")).toBe(true);
    expect(
      isSubCvConnectionBlocked("osc-sub", "cv-freq", protectedIds)
    ).toBe(true);
    expect(
      isSubCvConnectionBlocked("osc-body", "cv-freq", protectedIds)
    ).toBe(false);
  });
});

describe("wave A runtimes", () => {
  const param = (value = 0) => ({
    value,
    setTargetAtTime(v: number) {
      this.value = v;
    },
  });

  const mockCtx = {
    currentTime: 0,
    createGain: () => ({
      kind: "gain",
      gain: param(1),
      channelCount: 2,
      channelCountMode: "max",
      connect() {
        return this;
      },
      disconnect() {},
    }),
    createOscillator: () => ({
      kind: "osc",
      type: "sine",
      frequency: param(110),
      connect() {
        return this;
      },
      disconnect() {},
      start() {},
      stop() {},
    }),
    createBiquadFilter: () => ({
      kind: "filter",
      type: "lowpass",
      frequency: param(1000),
      Q: param(1),
      connect() {
        return this;
      },
      disconnect() {},
    }),
    createWaveShaper: () => ({
      kind: "shaper",
      curve: null as Float32Array | null,
      oversample: "none",
      connect() {
        return this;
      },
      disconnect() {},
    }),
    createConstantSource: () => ({
      offset: param(1),
      connect() {
        return this;
      },
      disconnect() {},
      start() {},
      stop() {},
    }),
  } as unknown as AudioContext;

  it("creates FM with cv-index param", () => {
    const fm = createRuntimeNode(mockCtx, "fm", "fm-1", {
      frequency: 110,
      ratio: 2,
      index: 500,
    });
    expect(fm?.kind).toBe("fm");
    expect(fm?.getParam("cv-index")).not.toBeNull();
    expect(fm?.getParam("cv-freq")).not.toBeNull();
  });

  it("creates distortion with waveshaper curve", () => {
    const curve = buildWaveshaperCurve("hard", 4);
    expect(curve.length).toBeGreaterThan(0);
    const dist = createRuntimeNode(mockCtx, "distortion", "d-1", {
      type: "hard",
      drive: 5,
      mix: 0.9,
    });
    expect(dist?.kind).toBe("distortion");
    expect(dist?.getInput("audio-in")).not.toBeNull();
  });

  it("creates 3-layer stack with sub/body/top inputs", () => {
    const stack = createRuntimeNode(mockCtx, "layerStack", "s-1", {});
    expect(stack?.getInput("audio-in-sub")).not.toBeNull();
    expect(stack?.getInput("audio-in-body")).not.toBeNull();
    expect(stack?.getInput("audio-in-top")).not.toBeNull();
    expect(stack?.getParam("cv-freq")).toBeNull();
  });
});
