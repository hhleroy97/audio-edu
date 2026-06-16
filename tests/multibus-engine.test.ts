import { describe, expect, it } from "vitest";
import { MasterBus } from "@/lib/song/multibus/master-bus";
import { compileMultibusSchedule } from "@/lib/song/multibus/compile-schedule";
import { riddim16Standard } from "@/lib/song/templates/multibus-riddim";
import { lintSong } from "@/lib/song/lint-song";
import { validateSong } from "@/lib/song/validate-song";

function mockCtx() {
  const makeGain = () => ({
    gain: { value: 1, setTargetAtTime: () => {} },
    connect: () => {},
    disconnect: () => {},
  });
  const makeFilter = () => ({
    type: "lowpass",
    frequency: { value: 1000 },
    Q: { value: 1 },
    connect: () => {},
    disconnect: () => {},
  });
  return {
    currentTime: 0,
    destination: {},
    createGain: makeGain,
    createBiquadFilter: makeFilter,
    createDynamicsCompressor: () => ({
      threshold: { value: -24 },
      ratio: { value: 4 },
      attack: { value: 0.003 },
      release: { value: 0.25 },
      knee: { value: 0 },
      connect: () => {},
      disconnect: () => {},
    }),
    createChannelSplitter: () => ({
      connect: () => {},
      disconnect: () => {},
    }),
    createChannelMerger: () => ({
      connect: () => {},
      disconnect: () => {},
    }),
    createAnalyser: () => ({
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      connect: () => {},
      disconnect: () => {},
    }),
  } as unknown as AudioContext;
}

describe("multibus master bus", () => {
  it("registers layer inputs with mix strips", () => {
    const ctx = mockCtx();
    const bus = new MasterBus(ctx);
    bus.addLayer("sub", 0.7, "sub");
    bus.addLayer("body", 0.48, "body");
    expect(bus.getLayerIds()).toEqual(["sub", "body"]);
    expect(bus.getStripInput("sub")).toBeDefined();
    expect(bus.getMixProfile("body")).toBe("body");
    bus.dispose();
  });
});

describe("compile multibus schedule", () => {
  it("includes intro mute and drop notes for riddim-16-standard", () => {
    const actions = compileMultibusSchedule(riddim16Standard, 1, 140);
    const mutes = actions.filter(
      (a) => a.type === "layerGain" && a.layerId === "body" && a.gain === 0
    );
    expect(mutes.length).toBeGreaterThan(0);
    const notes = actions.filter((a) => a.type === "note");
    expect(notes.some((n) => n.layerId === "sub")).toBe(true);
    expect(notes.some((n) => n.layerId === "body")).toBe(true);
  });

  it("schedules layerPreset swap at drop B", () => {
    const actions = compileMultibusSchedule(riddim16Standard, 0, 140);
    expect(
      actions.some(
        (a) =>
          a.type === "layerPreset" &&
          a.presetId === "harsh-square-fm" &&
          a.absoluteBeat === 12 * 4
      )
    ).toBe(true);
  });
});

describe("multibus song lint", () => {
  it("passes riddim-16-standard", () => {
    const { song } = validateSong(riddim16Standard);
    const lint = lintSong(song);
    expect(lint.ok).toBe(true);
  });
});
