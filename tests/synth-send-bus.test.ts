import { describe, expect, it } from "vitest";
import { SynthSendBus } from "@/lib/song/multibus/synth-send-bus";
import { MasterBus } from "@/lib/song/multibus/master-bus";

function mockCtx() {
  const makeGain = () => ({
    gain: {
      value: 1,
      setTargetAtTime: () => {},
      cancelScheduledValues: () => {},
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
    },
    connect: () => {},
    disconnect: () => {},
  });
  return {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createGain: makeGain,
    createBiquadFilter: () => ({
      type: "lowpass",
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: () => {},
      disconnect: () => {},
    }),
    createConvolver: () => ({
      buffer: null,
      connect: () => {},
      disconnect: () => {},
    }),
    createDelay: () => ({
      delayTime: { value: 0.1, connect: () => {}, disconnect: () => {} },
      connect: () => {},
      disconnect: () => {},
    }),
    createOscillator: () => ({
      frequency: { value: 1, connect: () => {}, disconnect: () => {} },
      start: () => {},
      stop: () => {},
      connect: () => {},
      disconnect: () => {},
    }),
    createDynamicsCompressor: () => ({
      threshold: { value: -24 },
      ratio: { value: 4 },
      attack: { value: 0.003 },
      release: { value: 0.25 },
      knee: { value: 0 },
      connect: () => {},
      disconnect: () => {},
    }),
    createChannelSplitter: () => ({ connect: () => {}, disconnect: () => {} }),
    createChannelMerger: () => ({ connect: () => {}, disconnect: () => {} }),
    createWaveShaper: () => ({
      curve: null,
      oversample: "none",
      connect: () => {},
      disconnect: () => {},
    }),
    createAnalyser: () => ({
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      connect: () => {},
      disconnect: () => {},
    }),
    createBuffer: (channels: number, length: number) => ({
      numberOfChannels: channels,
      length,
      getChannelData: () => new Float32Array(length),
    }),
  } as unknown as AudioContext;
}

describe("SynthSendBus (#113)", () => {
  it("constructs reverb + delay + chorus returns", () => {
    const ctx = mockCtx();
    const dest = ctx.createGain();
    const bus = new SynthSendBus(ctx, dest);
    expect(bus.input).toBeDefined();
    bus.setMix({ reverbMix: 0.2, delayMix: 0.1, chorusMix: 0.05 });
    bus.dispose();
  });

  it("MasterBus wires per-layer send gains", () => {
    const ctx = mockCtx();
    const master = new MasterBus(ctx);
    master.addLayer("sub", 0.7, "sub");
    master.addLayer("body", 0.5, "body");
    master.addLayer("top", 0.3, "top");
    master.applyDefaultSynthSends();
    expect(master.getLayerIds()).toEqual(["sub", "body", "top"]);
    master.dispose();
  });
});
