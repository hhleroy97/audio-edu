import { describe, expect, it } from "vitest";
import { createRuntimeNode } from "@/lib/patch/runtime-nodes";
import { AudioEngine } from "@/lib/patch/audio-engine";

type TrackedParam = {
  value: number;
  setTargetAtTime: (v: number) => void;
};

type TrackedNode = {
  kind: string;
  connections: TrackedNode[];
  connect: (node: TrackedNode | TrackedParam) => TrackedNode | TrackedParam;
  disconnect: () => void;
  frequency?: TrackedParam;
  Q?: TrackedParam;
  type?: string;
  start?: () => void;
  stop?: () => void;
  gain?: TrackedParam;
};

function createMockContext() {
  const param = (value = 0): TrackedParam => ({
    value,
    setTargetAtTime(v: number) {
      this.value = v;
    },
  });

  const node = (kind: string, extra: Partial<TrackedNode> = {}): TrackedNode => ({
    kind,
    connections: [],
    connect(target) {
      if ("kind" in target || "value" in target) {
        this.connections.push(target as TrackedNode);
      }
      return target;
    },
    disconnect() {
      this.connections = [];
    },
    ...extra,
  });

  return {
    currentTime: 0,
    destination: node("destination"),
    createGain: () => node("gain", { gain: param(1) }),
    createOscillator: () =>
      node("osc", {
        type: "sine",
        frequency: param(2),
        start() {},
        stop() {},
      }),
    createBiquadFilter: () =>
      node("biquad", {
        type: "lowpass",
        frequency: param(1200),
        Q: param(1),
      }),
    createAnalyser: () =>
      node("analyser", {
        fftSize: 2048,
        smoothingTimeConstant: 0.8,
      }),
  } as unknown as AudioContext;
}

describe("LFO runtime", () => {
  it("exposes cv-out for modulation", () => {
    const ctx = createMockContext();
    const lfo = createRuntimeNode(ctx, "lfo", "lfo-1", {
      rate: 4,
      depth: 200,
      shape: "sine",
    });
    expect(lfo).not.toBeNull();
    expect(lfo!.getOutput("cv-out")).not.toBeNull();
    expect(lfo!.getOutput("audio-out")).toBeNull();
    lfo!.dispose();
  });
});

describe("filter runtime", () => {
  it("routes audio and exposes cv-cutoff param", () => {
    const ctx = createMockContext();
    const filter = createRuntimeNode(ctx, "filter", "filt-1", {
      cutoff: 500,
      resonance: 4,
    });
    expect(filter).not.toBeNull();
    expect(filter!.getInput("audio-in")).not.toBeNull();
    expect(filter!.getOutput("audio-out")).not.toBeNull();
    expect(filter!.getParam("cv-cutoff")).not.toBeNull();
    filter!.dispose();
  });
});

describe("wobble patch validation", () => {
  it("accepts LFO cv-out → filter cv-cutoff connection", () => {
    const ctx = createMockContext();
    const engine = new AudioEngine(ctx);

    expect(
      engine.isValidConnection({
        source: "lfo-1",
        target: "filt-1",
        sourceHandle: "cv-out",
        targetHandle: "cv-cutoff",
      })
    ).toBe(true);

    engine.dispose();
  });
});
