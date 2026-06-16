import { describe, expect, it } from "vitest";
import { compileMultibusSchedule } from "@/lib/song/multibus/compile-schedule";
import {
  expandModProfile,
  getModProfile,
  listModProfiles,
  RIDDIM_MOD_PROFILES,
} from "@/lib/song/riddim/mod-schemas";
import {
  buildHalftimeGroove,
  buildSparseIntroSub,
} from "@/lib/song/riddim/patterns";
import {
  buildRiddimArrangement,
  riddimSickDrop16,
  riddimSickDrop32,
} from "@/lib/song/riddim/arrangement-builder";
import { lintSong } from "@/lib/song/lint-song";
import { validateSong } from "@/lib/song/validate-song";

describe("riddim mod profiles", () => {
  it("defines profiles for each major drop archetype", () => {
    const ids = listModProfiles().map((p) => p.id);
    expect(ids).toContain("hydraulic-drop-swell");
    expect(ids).toContain("dual-lfo-fm-drop");
    expect(ids).toContain("drop-b-preset-swap-throw");
  });

  it("expandModProfile emits automation events on body layer", () => {
    const events = expandModProfile("hydraulic-drop-swell", "body");
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.kind === "automation" && e.layer === "body")).toBe(
      true
    );
    expect(events.some((e) => e.param === "depth" && e.nodeId === "lfo-1")).toBe(
      true
    );
  });

  it("profiles cite sources.md refs", () => {
    for (const profile of Object.values(RIDDIM_MOD_PROFILES)) {
      expect(profile.sources.length).toBeGreaterThan(0);
      expect(getModProfile(profile.id)?.presetId).toBe(profile.presetId);
    }
  });
});

describe("riddim pattern builders", () => {
  it("halftime groove hits beats 0 and 2 per bar", () => {
    const events = buildHalftimeGroove({
      bars: 2,
      layers: [{ layer: "sub" }, { layer: "body" }],
    });
    const beats = events.map((e) => e.beat).sort((a, b) => a - b);
    expect(beats).toEqual([0, 0, 2, 2, 4, 4, 6, 6]);
  });

  it("sparse intro sub fires every other bar", () => {
    const events = buildSparseIntroSub(4);
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.beat)).toEqual([0, 8]);
  });
});

describe("riddim arrangement builder", () => {
  it("builds sick drop 16 with build section and mod automation", () => {
    const { song } = validateSong(riddimSickDrop16);
    expect(song.meta.bars).toBe(16);
    expect(song.sections.some((s) => s.id === "build")).toBe(true);

    const automations = song.sections
      .flatMap((s) => s.events)
      .filter((e) => e.kind === "automation");
    expect(automations.length).toBeGreaterThan(4);

    const lint = lintSong(song);
    expect(lint.ok).toBe(true);
  });

  it("schedules drop B preset swap and FM mod throws", () => {
    const actions = compileMultibusSchedule(riddimSickDrop16, 0, 140);
    expect(
      actions.some(
        (a) =>
          a.type === "layerPreset" &&
          a.presetId === "harsh-square-fm" &&
          a.absoluteBeat === 48
      )
    ).toBe(true);
    expect(
      actions.some(
        (a) =>
          a.type === "automation" &&
          a.layerId === "body" &&
          a.param === "index"
      )
    ).toBe(true);
  });

  it("32-bar set includes top layer and three-band structure", () => {
    const { song } = validateSong(riddimSickDrop32);
    expect(song.layers.map((l) => l.id)).toEqual(["sub", "body", "top"]);
    expect(song.sections.some((s) => s.id === "outro")).toBe(true);
  });

  it("custom arrangement from config validates", () => {
    const song = buildRiddimArrangement({
      id: "test-riddim-8",
      title: "Test 8",
      bars: 8,
      sections: [
        {
          id: "intro",
          label: "Intro",
          kind: "intro",
          startBar: 0,
          endBar: 2,
        },
        {
          id: "drop",
          label: "Drop",
          kind: "drop",
          startBar: 2,
          endBar: 8,
          modProfileId: "subfiltronik-static-loop",
        },
      ],
    });
    const lint = lintSong(song);
    expect(lint.ok).toBe(true);
  });
});
