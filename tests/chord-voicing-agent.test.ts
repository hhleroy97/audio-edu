import { describe, expect, it } from "vitest";
import {
  countBarChordChanges,
  countUniqueChordRoots,
  runArrangement,
  runChordVoicingAgent,
  runHarmonyAgent,
} from "@/lib/song/agents";
import { RIDDIM_STANDARD_16 } from "@/lib/song/agents/rule-packs";
import { runEvaluationAgent } from "@/lib/song/agents/evaluation-agent";

describe("ChordVoicingAgent (#106)", () => {
  it("builds barSlots per section bar", () => {
    const harmony = runHarmonyAgent(RIDDIM_STANDARD_16, "chord-test");
    const voicing = runChordVoicingAgent(RIDDIM_STANDARD_16, harmony);
    const drop = voicing.plans.find((p) => p.sectionId === "drop-a");
    expect(drop?.barSlots?.length).toBe(4);
    expect(drop?.barSlots?.[0]?.chordSymbol).toMatch(/F#/);
  });

  it("uses fifth voicing on body degrees when configured", () => {
    const harmony = runHarmonyAgent(RIDDIM_STANDARD_16, "fifth-test");
    const voicing = runChordVoicingAgent(RIDDIM_STANDARD_16, harmony);
    const drop = voicing.plans.find((p) => p.sectionId === "drop-a");
    const slot = drop?.barSlots?.[0];
    expect(slot?.bodyDegrees.length).toBeGreaterThanOrEqual(1);
  });

  it("varies sub roots across bars in drop sections", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "chord-voicing-arr",
    });
    const drop = run.song.sections.find((s) => s.id === "drop-a");
    const subMidis = new Set(
      drop?.events
        .filter((e) => e.kind === "note" && e.layer === "sub" && e.midi !== undefined)
        .map((e) => (e.kind === "note" ? e.midi : 0))
    );
    expect(subMidis.size).toBeGreaterThanOrEqual(2);
  });

  it("passes chord evaluation gates", () => {
    const harmony = runHarmonyAgent(RIDDIM_STANDARD_16, "eval-chord");
    const voicing = runChordVoicingAgent(RIDDIM_STANDARD_16, harmony);
    expect(countUniqueChordRoots(voicing.plans)).toBeGreaterThanOrEqual(2);
    expect(countBarChordChanges(voicing.plans)).toBeGreaterThanOrEqual(2);

    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "chord-eval",
    });
    const report = runEvaluationAgent(run.song, RIDDIM_STANDARD_16);
    expect(report.metrics.uniqueChordRoots).toBeGreaterThanOrEqual(2);
    expect(report.ok).toBe(true);
  });
});
