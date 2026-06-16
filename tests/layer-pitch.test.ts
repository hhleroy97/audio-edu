import { describe, expect, it } from "vitest";
import { AudioEngine } from "@/lib/patch/audio-engine";
import { patchToFlow } from "@/lib/patch/patch-flow";
import { presetToPatch } from "@/lib/patch/presets/load";
import { midiToFrequency } from "@/lib/patch/piano-keyboard";
import { compileMultibusSchedule } from "@/lib/song/multibus/compile-schedule";
import { runArrangement } from "@/lib/song/agents";
import { RIDDIM_STANDARD_16 } from "@/lib/song/agents/rule-packs";

function mockAudioContext() {
  const freqParams = new Map<string, number>();
  const makeParam = (key: string, initial = 440) => {
    const param = {
      value: initial,
      setValueAtTime: (v: number) => {
        param.value = v;
        freqParams.set(key, v);
      },
      setTargetAtTime: (v: number) => {
        param.value = v;
        freqParams.set(key, v);
      },
      cancelScheduledValues: () => {},
    };
    return param;
  };

  return {
    currentTime: 0,
    sampleRate: 44100,
    state: "running",
    destination: {},
    createGain: () => ({
      gain: makeParam("gain", 1),
      connect: () => {},
      disconnect: () => {},
    }),
    createOscillator: () => ({
      frequency: makeParam("osc-freq", 55),
      type: "sine",
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
    }),
    createBiquadFilter: () => ({
      type: "lowpass",
      frequency: makeParam("filt-freq", 1000),
      Q: { value: 1 },
      connect: () => {},
      disconnect: () => {},
    }),
    createAnalyser: () => ({
      fftSize: 2048,
      connect: () => {},
      disconnect: () => {},
    }),
    createWaveShaper: () => ({
      curve: null,
      connect: () => {},
      disconnect: () => {},
    }),
    resume: async () => {},
    _freqParams: freqParams,
  } as unknown as AudioContext & { _freqParams: Map<string, number> };
}

describe("Layer pitch tracking (#112)", () => {
  it("propagates scheduled MIDI to oscillator frequency", async () => {
    const patch = presetToPatch("clean-sub");
    expect(patch).toBeTruthy();
    const ctx = mockAudioContext();
    const engine = new AudioEngine(ctx);
    const flow = patchToFlow(patch!);
    engine.syncUiGraph(flow.nodes, flow.edges);
    await engine.resume();
    engine.start();

    const lowHz = midiToFrequency(36);
    const highHz = midiToFrequency(48);
    engine.setActiveNoteHzAt(lowHz, 0);
    expect(engine.getActiveNoteHz()).toBeCloseTo(lowHz, 0);
    engine.setActiveNoteHzAt(highHz, 0.05);
    expect(engine.getActiveNoteHz()).toBeCloseTo(highHz, 0);
  });
});

describe("Arrangement note pitch variety (#114)", () => {
  it("drop sub notes use multiple distinct MIDI values", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "pitch-variety",
    });
    const drop = run.song.sections.find((s) => s.id === "drop-a");
    const subMidis = new Set(
      drop?.events
        .filter((e) => e.kind === "note" && e.layer === "sub" && e.midi !== undefined)
        .map((e) => (e.kind === "note" ? e.midi : 0))
    );
    expect(subMidis.size).toBeGreaterThanOrEqual(2);

    const actions = compileMultibusSchedule(run.song, 0, run.song.meta.bpm);
    const subNotes = actions.filter(
      (a) => a.type === "note" && a.layerId === "sub" && a.absoluteBeat >= 16
    );
    const actionMidis = new Set(subNotes.map((n) => (n.type === "note" ? n.midi : 0)));
    expect(actionMidis.size).toBeGreaterThanOrEqual(2);
  });
});
