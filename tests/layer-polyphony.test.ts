import { describe, expect, it } from "vitest";
import { LayerEngine, VOICE_POOL_SIZE } from "@/lib/song/multibus/layer-engine";
import { midiToFrequency } from "@/lib/patch/piano-keyboard";

function mockCtx() {
  const makeGain = (initial = 1) => ({
    gain: { value: initial, setValueAtTime: () => {}, setTargetAtTime: () => {} },
    connect: () => {},
    disconnect: () => {},
  });
  return {
    currentTime: 0,
    sampleRate: 44100,
    state: "running",
    destination: {},
    createGain: () => makeGain(),
    createOscillator: () => ({
      frequency: { value: 55, setValueAtTime: () => {}, setTargetAtTime: () => {} },
      type: "sine",
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
    }),
    createBiquadFilter: () => ({
      type: "lowpass",
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: () => {},
      disconnect: () => {},
    }),
    createAnalyser: () => ({ fftSize: 2048, connect: () => {}, disconnect: () => {} }),
    createWaveShaper: () => ({ curve: null, connect: () => {}, disconnect: () => {} }),
    createBuffer: () => ({ getChannelData: () => new Float32Array(8) }),
    resume: async () => {},
  } as unknown as AudioContext;
}

describe("LayerEngine voice pool (#116)", () => {
  it("allocates multiple voices for body layer", () => {
    const ctx = mockCtx();
    const bus = ctx.createGain();
    const layer = new LayerEngine(ctx, "body", bus, "body");
    expect(layer.voiceCount).toBe(VOICE_POOL_SIZE.body);
  });

  it("sub layer stays monophonic", () => {
    const ctx = mockCtx();
    const bus = ctx.createGain();
    const layer = new LayerEngine(ctx, "sub", bus, "sub");
    expect(layer.voiceCount).toBe(1);
  });

  it("scheduleChord uses separate voice slots", () => {
    const ctx = mockCtx();
    const bus = ctx.createGain();
    const layer = new LayerEngine(ctx, "body", bus, "body");
    layer.loadPreset("clean-sub", 0.8);
    layer.scheduleChord([42, 49], 0, 0.5);
    expect(layer.engine.getActiveNoteHz()).toBeGreaterThan(0);
    expect(midiToFrequency(49)).toBeGreaterThan(midiToFrequency(42));
  });
});
