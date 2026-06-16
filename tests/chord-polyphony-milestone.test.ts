import { describe, expect, it } from "vitest";
import { runArrangement } from "@/lib/song/agents";
import { countMaxSimultaneousBodyNotes } from "@/lib/song/agents/chord-voicing-agent";
import { RIDDIM_STANDARD_16 } from "@/lib/song/agents/rule-packs";

describe("Chord pattern IR (#117)", () => {
  it("triad voicing stacks three body notes in standard pack", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "triad-voicing-test",
    });
    expect(RIDDIM_STANDARD_16.harmony?.voicingMode).toBe("triad");
    const dropIds = new Set(
      RIDDIM_STANDARD_16.sections.filter((s) => s.kind === "drop").map((s) => s.id)
    );
    expect(countMaxSimultaneousBodyNotes(run.song.sections, dropIds)).toBeGreaterThanOrEqual(3);
  });

  it("emits stacked body notes per halftime hit in drops", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "chord-ir-eval",
    });
    const dropIds = new Set(
      RIDDIM_STANDARD_16.sections
        .filter((s) => s.kind === "drop")
        .map((s) => s.id)
    );
    const simultaneous = countMaxSimultaneousBodyNotes(run.song.sections, dropIds);
    expect(simultaneous).toBeGreaterThanOrEqual(2);
  });

  it("bar slots include bodyMidis arrays", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "chord-midis",
    });
    const dropIds = new Set(["drop-a"]);
    expect(countMaxSimultaneousBodyNotes(run.song.sections, dropIds)).toBeGreaterThanOrEqual(
      2
    );
  });
});

describe("Timbre scoring (#118)", () => {
  it("uses multiple archetype body presets across sections", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "timbre-score",
    });
    const bodyPresets = new Set<string>();
    for (const section of run.song.sections) {
      for (const ev of section.events) {
        if (ev.kind === "layerPreset" && ev.layer === "body") {
          bodyPresets.add(ev.presetId);
        }
      }
    }
    expect(bodyPresets.size).toBeGreaterThanOrEqual(3);
  });
});

describe("Beat automation (#120)", () => {
  it("adds phrase-slot automation in drops", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "beat-auto",
    });
    const drop = run.song.sections.find((s) => s.id === "drop-a");
    const phraseAuto = drop?.events.filter(
      (e) =>
        e.kind === "automation" &&
        (e.nodeId === "filt-1" || e.nodeId === "macro-1" || e.nodeId === "mfx-1")
    );
    expect(phraseAuto?.length ?? 0).toBeGreaterThanOrEqual(4);
  });
});
