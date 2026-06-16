import { describe, expect, it } from "vitest";
import { runModFxAgent } from "@/lib/song/agents/modfx-agent";
import { RIDDIM_STANDARD_16 } from "@/lib/song/agents/rule-packs";
import { compileMultibusSchedule } from "@/lib/song/multibus/compile-schedule";
import { SongDef } from "@/lib/schemas/song";
import { DrumSendBus } from "@/lib/song/drums/drum-send-bus";
import { DrumEngine } from "@/lib/song/drums/drum-engine";

function mockCtx() {
  const makeGain = (initial = 1) => {
    const gain = {
      value: initial,
      cancelScheduledValues: () => {},
      setValueAtTime: (v: number) => {
        gain.value = v;
      },
      linearRampToValueAtTime: (v: number) => {
        gain.value = v;
      },
    };
    return { gain, connect: () => {}, disconnect: () => {} };
  };
  return {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createGain: makeGain,
    createConvolver: () => ({
      buffer: null,
      connect: () => {},
      disconnect: () => {},
    }),
    createDelay: () => ({
      delayTime: { value: 0.187 },
      connect: () => {},
      disconnect: () => {},
    }),
    createBiquadFilter: () => ({
      type: "lowpass",
      frequency: { value: 1000 },
      connect: () => {},
      disconnect: () => {},
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
    createOscillator: () => ({
      type: "sine",
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {},
    }),
  } as unknown as AudioContext;
}

describe("ModFxAgent drum send events (#109)", () => {
  it("emits drumSendFx at each section start", () => {
    const sections = RIDDIM_STANDARD_16.sections.map((s) => ({
      id: s.id,
      label: s.label,
      startBar: s.startBar,
      endBar: s.endBar,
      events: [] as const,
    }));

    const result = runModFxAgent({
      pack: RIDDIM_STANDARD_16,
      sections,
      drums: { hits: [] },
      layerIds: new Set(["sub", "body", "top"]),
    });

    const sendEvents = result.sections.flatMap((sec) =>
      sec.events.filter((ev) => ev.kind === "drumSendFx")
    );
    expect(sendEvents.length).toBe(sections.length);
    const dropSection = result.sections.find((s) => s.id === "drop-a");
    const dropSend = dropSection?.events.find((ev) => ev.kind === "drumSendFx");
    expect(dropSend).toMatchObject({
      kind: "drumSendFx",
      beat: 0,
      reverbMix: 0.28,
      delayMix: 0.15,
    });
  });
});

describe("compileMultibusSchedule drumSendFx", () => {
  it("compiles section drumSendFx to timeline actions", () => {
    const song = SongDef.parse({
      meta: {
        id: "send-test",
        title: "Send Test",
        bpm: 140,
        bars: 4,
        beatsPerBar: 4,
        gate: "auto",
        version: 2,
      },
      schemaVersion: 2,
      layers: [{ id: "sub", presetId: "clean-sub" }],
      sections: [
        {
          id: "drop",
          label: "Drop",
          startBar: 0,
          endBar: 4,
          events: [
            { kind: "drumSendFx", beat: 0, reverbMix: 0.25, delayMix: 0.1 },
          ],
        },
      ],
      drums: { hits: [] },
    });

    const actions = compileMultibusSchedule(song, 0, 140);
    const send = actions.filter((a) => a.type === "drumSendFx");
    expect(send).toHaveLength(1);
    expect(send[0]).toMatchObject({
      type: "drumSendFx",
      reverbMix: 0.25,
      delayMix: 0.1,
      absoluteBeat: 0,
    });
  });
});

describe("DrumEngine send bus", () => {
  it("sets send mix without throwing", () => {
    const ctx = mockCtx();
    const dest = ctx.createGain();
    const engine = new DrumEngine(ctx, dest.gain as unknown as AudioNode);
    expect(() =>
      engine.setSendFx({ reverbMix: 0.22, delayMix: 0.12 })
    ).not.toThrow();
    engine.dispose();
  });

  it("tracks loaded sample buffers", () => {
    const ctx = mockCtx();
    const dest = ctx.createGain();
    const engine = new DrumEngine(ctx, dest.gain as unknown as AudioNode);
    const buffer = ctx.createBuffer(1, 100, 44100);
    engine.setSampleBuffer("kick", buffer);
    expect(engine.loadedSampleCount).toBe(1);
    expect(engine.usesSampleBuffer("kick")).toBe(true);
    expect(engine.usesSampleBuffer("snare")).toBe(false);
    engine.dispose();
  });
});

describe("DrumSendBus IR", () => {
  it("creates procedural reverb buffer", () => {
    const ctx = mockCtx();
    const dest = ctx.createGain();
    expect(() => new DrumSendBus(ctx, dest.gain as unknown as AudioNode)).not.toThrow();
  });
});
