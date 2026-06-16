import { describe, expect, it } from "vitest";
import { rampFrequency } from "@/lib/patch/glide";
import { lfoRateMultiplier } from "@/lib/patch/lfo-ratio";
import { resolveLfoRateHz } from "@/lib/patch/transport";
import { createRuntimeNode } from "@/lib/patch/runtime-nodes";

describe("glide", () => {
  it("ramps frequency when gate is open and glideMs > 0", () => {
    const calls: string[] = [];
    const param = {
      value: 110,
      cancelScheduledValues: () => calls.push("cancel"),
      setValueAtTime: (v: number) => {
        calls.push(`set:${v}`);
      },
      exponentialRampToValueAtTime: (v: number) => {
        calls.push(`ramp:${v}`);
      },
      setTargetAtTime: () => calls.push("target"),
    };
    rampFrequency(param as unknown as AudioParam, 220, 0, 40, true);
    expect(calls).toContain("cancel");
    expect(calls).toContain("ramp:220");
  });
});

describe("LFO rate ratio", () => {
  it("applies half and double multipliers", () => {
    expect(lfoRateMultiplier("half")).toBe(0.5);
    expect(lfoRateMultiplier("double")).toBe(2);
    expect(
      resolveLfoRateHz({ sync: "free", rate: 4, rateRatio: "half" }, 140)
    ).toBe(2);
  });
});

describe("wave C runtimes", () => {
  const param = (value = 0) => ({
    value,
    setTargetAtTime(v: number) {
      this.value = v;
    },
    cancelScheduledValues() {},
    setValueAtTime(v: number) {
      this.value = v;
    },
    exponentialRampToValueAtTime(v: number) {
      this.value = v;
    },
  });

  const mockCtx = {
    currentTime: 0,
    sampleRate: 48000,
    createGain: () => ({
      gain: param(1),
      connect() {
        return this;
      },
      disconnect() {},
    }),
    createBiquadFilter: () => ({
      type: "lowpass",
      frequency: param(1000),
      Q: param(1),
      connect() {
        return this;
      },
      disconnect() {},
    }),
    createDynamicsCompressor: () => ({
      threshold: param(-24),
      ratio: param(8),
      attack: param(0.003),
      release: param(0.12),
      knee: param(6),
      connect() {
        return this;
      },
      disconnect() {},
    }),
    createDelay: () => ({
      delayTime: param(0.003),
      connect() {
        return this;
      },
      disconnect() {},
    }),
    createOscillator: () => ({
      type: "sine",
      frequency: param(0.4),
      connect() {
        return this;
      },
      disconnect() {},
      start() {},
      stop() {},
      setPeriodicWave() {},
    }),
    createBuffer: () => ({ getChannelData: () => new Float32Array(8) }),
    createBufferSource: () => ({
      buffer: null,
      loop: false,
      connect() {
        return this;
      },
      disconnect() {},
      start() {},
      stop() {},
    }),
  } as unknown as AudioContext;

  it("creates multiband, modFx, and filterBank runtimes", () => {
    expect(createRuntimeNode(mockCtx, "multiband", "mb-1", {})?.kind).toBe(
      "multiband"
    );
    expect(createRuntimeNode(mockCtx, "modFx", "mfx-1", {})?.kind).toBe("modFx");
    expect(createRuntimeNode(mockCtx, "filterBank", "fb-1", {})?.kind).toBe(
      "filterBank"
    );
  });
});
