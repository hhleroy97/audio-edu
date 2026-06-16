import { describe, expect, it } from "vitest";
import { createRuntimeNode } from "@/lib/patch/runtime-nodes";

type TrackedParam = {
  value: number;
  setTargetAtTime: (v: number) => void;
};

type TrackedNode = {
  kind: string;
  connections: (TrackedNode | TrackedParam)[];
  connect: (node: TrackedNode | TrackedParam) => TrackedNode | TrackedParam;
  disconnect: () => void;
  frequency?: TrackedParam;
  gain?: TrackedParam;
  offset?: TrackedParam;
  start?: (t?: number) => void;
  stop?: (t?: number) => void;
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
      this.connections.push(target);
      return target;
    },
    disconnect() {
      this.connections = [];
    },
    ...extra,
  });

  return {
    createGain: () => node("gain", { gain: param(1) }),
    createOscillator: () =>
      node("oscillator", { frequency: param(440), start: () => {}, stop: () => {} }),
    createConstantSource: () =>
      node("constant", { offset: param(1), start: () => {}, stop: () => {} }),
    createBiquadFilter: () => node("filter", { frequency: param(1000), Q: param(1) }),
    createAnalyser: () => node("analyser"),
    currentTime: 0,
  } as unknown as AudioContext;
}

describe("mixer + wavetable runtimes", () => {
  it("creates a two-channel mixer", () => {
    const ctx = createMockContext();
    const mixer = createRuntimeNode(ctx, "mixer", "mix-1", {
      gainA: 0.6,
      gainB: 0.4,
      gain: 0.8,
    });
    expect(mixer?.kind).toBe("mixer");
    expect(mixer?.getInput("audio-in-a")).not.toBeNull();
    expect(mixer?.getInput("audio-in-b")).not.toBeNull();
    expect(mixer?.getOutput("audio-out")).not.toBeNull();
  });

  it("creates a key-gated wavetable with cv position", () => {
    const ctx = createMockContext();
    const wt = createRuntimeNode(ctx, "wavetable", "wt-1", {
      waveformA: "sine",
      waveformB: "sawtooth",
      frequency: 110,
      position: 0.5,
      gain: 0.5,
    });
    expect(wt?.kind).toBe("wavetable");
    expect(wt?.getParam("cv-pos")).not.toBeNull();
    expect(wt?.setKeyGate).toBeDefined();
    wt?.start(0);
    wt?.setKeyGate?.(true, 0);
  });
});

describe("envelope cv runtime", () => {
  it("exposes cv-out for pitch or filter modulation", () => {
    const ctx = createMockContext();
    const env = createRuntimeNode(ctx, "envelope", "env-1", {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.5,
      release: 0.2,
      cvDepth: 500,
    });
    const osc = createRuntimeNode(ctx, "oscillator", "osc-1", {
      waveform: "sawtooth",
      frequency: 110,
    });

    const cvOut = env?.getOutput("cv-out");
    const freqParam = osc?.getParam("cv-freq");
    expect(cvOut).not.toBeNull();
    expect(freqParam).not.toBeNull();
    cvOut?.connect(freqParam!);

    expect(env?.getOutput("cv-out")).not.toBeNull();
    expect(osc?.getParam("cv-freq")).not.toBeNull();
  });
});
