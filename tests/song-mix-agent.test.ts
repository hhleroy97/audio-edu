import { describe, expect, it } from "vitest";
import type { StemMetricsType } from "@/lib/schemas/mix";
import { MixDef } from "@/lib/schemas/mix";
import { analyzeAudioBuffer } from "@/lib/song/mix/analyze-buffer";
import { lintMixDef } from "@/lib/song/mix/lint-mix";
import { proposeMixDef } from "@/lib/song/mix/propose-mix";
import { riddimSickDrop16 } from "@/lib/song/riddim/arrangement-builder";

function synthSineBuffer(
  hz: number,
  seconds: number,
  sampleRate: number,
  gain = 0.5
): AudioBuffer {
  const frames = Math.floor(seconds * sampleRate);
  const buffer = {
    sampleRate,
    length: frames,
    duration: seconds,
    numberOfChannels: 1,
    getChannelData: () => new Float32Array(frames),
  } as unknown as AudioBuffer;
  const data = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    data[i] = gain * Math.sin((2 * Math.PI * hz * i) / sampleRate);
  }
  (buffer.getChannelData as (ch: number) => Float32Array) = () => data;
  return buffer;
}

describe("analyzeAudioBuffer", () => {
  it("measures RMS and centroid for sine tone", () => {
    const buf = synthSineBuffer(110, 0.5, 48000, 0.4);
    const m = analyzeAudioBuffer(buf);
    expect(m.rms).toBeGreaterThan(0.1);
    expect(m.peak).toBeLessThanOrEqual(0.45);
    expect(m.centroidHz).toBeGreaterThan(0);
  });
});

describe("proposeMixDef", () => {
  it("raises body HPF when masking sub", () => {
    const stems: StemMetricsType[] = [
      {
        layerId: "sub",
        mixProfile: "sub",
        rms: 0.35,
        peak: 0.7,
        centroidHz: 60,
      },
      {
        layerId: "body",
        mixProfile: "body",
        rms: 0.32,
        peak: 0.75,
        centroidHz: 120,
      },
    ];
    const mix = proposeMixDef(riddimSickDrop16, {
      sampleRate: 48000,
      stems,
      masterPeak: 0.88,
      masterRms: 0.4,
    });
    const bodyAdj = mix.layers.find((l) => l.layerId === "body");
    expect(bodyAdj?.hpfHz).toBeGreaterThanOrEqual(105);
    expect(MixDef.safeParse(mix).success).toBe(true);
  });

  it("trims master when near clip", () => {
    const mix = proposeMixDef(riddimSickDrop16, {
      sampleRate: 48000,
      stems: [],
      masterPeak: 0.96,
      masterRms: 0.5,
    });
    expect(mix.master?.inputGain).toBeLessThan(0.9);
  });
});

describe("lintMixDef", () => {
  it("rejects HPF on sub layer", () => {
    const mix = MixDef.parse({
      songId: "test",
      layers: [{ layerId: "sub", hpfHz: 90 }],
    });
    const lint = lintMixDef(mix, new Map([["sub", "sub"]]));
    expect(lint.ok).toBe(false);
  });
});
