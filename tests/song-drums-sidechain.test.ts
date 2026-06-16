import { describe, expect, it } from "vitest";
import { DEFAULT_SIDECHAIN } from "@/lib/schemas/drums";
import { compileMultibusSchedule } from "@/lib/song/multibus/compile-schedule";
import { MasterBus } from "@/lib/song/multibus/master-bus";
import {
  buildRiddimDrumGrid,
  ensureRiddimDrums,
} from "@/lib/song/drums/riddim-drum-grid";
import { riddimSickDrop16 } from "@/lib/song/riddim/arrangement-builder";
import { SongDef } from "@/lib/schemas/song";

function mockCtx() {
  const scheduled: Array<{ layerId: string; atTime: number; depth: number }> =
    [];
  const makeGain = (initial = 1) => {
    const gain = {
      value: initial,
      setTargetAtTime: (v: number) => {
        gain.value = v;
      },
      cancelScheduledValues: () => {},
      setValueAtTime: (v: number) => {
        gain.value = v;
      },
      linearRampToValueAtTime: () => {},
    };
    return { gain, connect: () => {}, disconnect: () => {} };
  };
  return {
    currentTime: 0,
    destination: {},
    sampleRate: 44100,
    createGain: makeGain,
    createOscillator: () => ({
      type: "sine",
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {},
    }),
    createBuffer: (ch: number, len: number, sr: number) => ({
      numberOfChannels: ch,
      length: len,
      sampleRate: sr,
      getChannelData: () => new Float32Array(len),
    }),
    createBufferSource: () => ({
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {},
    }),
    createBiquadFilter: () => ({
      type: "lowpass",
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: () => {},
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
    createAnalyser: () => ({
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      connect: () => {},
      disconnect: () => {},
    }),
    createConvolver: () => ({
      buffer: null,
      connect: () => {},
      disconnect: () => {},
    }),
    createDelay: () => ({
      delayTime: { value: 0.1 },
      connect: () => {},
      disconnect: () => {},
    }),
    createWaveShaper: () => ({
      curve: null,
      oversample: "none",
      connect: () => {},
      disconnect: () => {},
    }),
    __scheduled: scheduled,
  } as unknown as AudioContext & {
    __scheduled: Array<{ layerId: string; atTime: number; depth: number }>;
  };
}

describe("riddim drum grid", () => {
  it("places kick on beats 0 and 2 per bar", () => {
    const hits = buildRiddimDrumGrid({ bars: 2, beatsPerBar: 4 });
    const kicks = hits.filter((h) => h.sampleId === "kick");
    expect(kicks.map((k) => k.beat)).toEqual([0, 2, 4, 6]);
  });

  it("ensureRiddimDrums attaches lane + sidechain to arrangement", () => {
    const song = riddimSickDrop16;
    expect(song.drums?.hits.length).toBeGreaterThan(0);
    expect(song.drums?.sidechain?.targetLayers).toContain("sub");
    expect(song.drums?.sidechain?.targetLayers).toContain("body");
  });

  it("skips muted intro/break/outro sections", () => {
    const base = SongDef.parse({
      meta: {
        id: "test",
        title: "Test",
        bpm: 140,
        bars: 8,
        beatsPerBar: 4,
        gate: "auto",
        version: 2,
      },
      schemaVersion: 2,
      layers: [{ id: "sub", presetId: "clean-sub" }],
      sections: [
        { id: "intro", label: "Intro", startBar: 0, endBar: 2 },
        { id: "drop", label: "Drop", startBar: 2, endBar: 6 },
        { id: "outro", label: "Outro", startBar: 6, endBar: 8 },
      ],
    });
    const withDrums = ensureRiddimDrums(base, {
      muteSectionIds: ["intro", "outro"],
    });
    const minBeat = Math.min(...(withDrums.drums?.hits.map((h) => h.beat) ?? [0]));
    expect(minBeat).toBe(8); // drop starts at bar 2 → beat 8
  });
});

describe("compile drum hits", () => {
  it("emits drumHit actions instead of drum gates", () => {
    const song = SongDef.parse({
      meta: {
        id: "drum-test",
        title: "Drum Test",
        bpm: 140,
        bars: 1,
        beatsPerBar: 4,
        gate: "auto",
        version: 2,
      },
      schemaVersion: 2,
      layers: [{ id: "sub", presetId: "clean-sub" }],
      sections: [{ id: "drop", label: "Drop", startBar: 0, endBar: 1 }],
      drums: {
        hits: [{ beat: 0, sampleId: "kick", velocity: 0.9 }],
        sidechain: DEFAULT_SIDECHAIN,
      },
    });
    const actions = compileMultibusSchedule(song, 0, 140);
    const drumActions = actions.filter((a) => a.type === "drumHit");
    expect(drumActions).toHaveLength(1);
    expect(drumActions[0]).toMatchObject({
      type: "drumHit",
      sampleId: "kick",
      velocity: 0.9,
    });
    expect(actions.some((a) => a.type === "gate" && a.layerId === "drums")).toBe(
      false
    );
  });
});

describe("sidechain duck", () => {
  it("schedules duckGain ramps without throwing", () => {
    const ctx = mockCtx();
    const bus = new MasterBus(ctx);
    bus.addLayer("sub", 0.7, "sub");
    bus.addLayer("body", 0.5, "body");

    expect(() =>
      bus.scheduleSidechainDuck("sub", 1.0, 0.32, 0.004, 0.14)
    ).not.toThrow();
    expect(() =>
      bus.scheduleSidechainDuck("body", 1.0, 0.32, 0.004, 0.14)
    ).not.toThrow();
  });
});
