import { describe, expect, it } from "vitest";
import {
  countDistinctBodyMidis,
  microTimingSpreadMs,
  runArrangement,
  runMelodicPhraseAgent,
  runPatternAgent,
  runSectionAgent,
  runHarmonyAgent,
  runChordVoicingAgent,
} from "@/lib/song/agents";
import { RIDDIM_STANDARD_16 } from "@/lib/song/agents/rule-packs";
import { runEvaluationAgent } from "@/lib/song/agents/evaluation-agent";

describe("MelodicPhraseAgent (#107)", () => {
  it("applies micro-timing and octave variation to drop notes", () => {
    const pack = RIDDIM_STANDARD_16;
    const layerIds = new Set(pack.layers!.map((l) => l.id));
    const sections = runSectionAgent(pack, layerIds).sections;
    const harmony = runHarmonyAgent(pack, "melody-unit");
    const voicing = runChordVoicingAgent(pack, harmony);
    const pattern = runPatternAgent({
      pack,
      sections,
      seed: "melody-unit",
      layerIds,
      harmonyPlans: voicing.plans,
    });
    const before = pattern.sections.find((s) => s.id === "drop-a")!;
    const integerBeats = before.events
      .filter((e) => e.kind === "note" && e.layer === "body")
      .every((e) => Number.isInteger(e.beat));

    const melody = runMelodicPhraseAgent({
      pack,
      sections: pattern.sections,
      seed: "melody-unit",
    });
    const after = melody.sections.find((s) => s.id === "drop-a")!;
    const bodyNotes = after.events.filter(
      (e) => e.kind === "note" && e.layer === "body" && e.midi !== undefined
    );
    const fractional = bodyNotes.some((e) => !Number.isInteger(e.beat));
    const distinctMidis = new Set(bodyNotes.map((e) => (e.kind === "note" ? e.midi : 0)));

    expect(integerBeats).toBe(true);
    expect(fractional).toBe(true);
    expect(distinctMidis.size).toBeGreaterThanOrEqual(2);
  });

  it("passes melody evaluation gates on full arrangement", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "melody-eval",
    });
    const dropIds = new Set(["drop-a"]);
    const spread = microTimingSpreadMs(
      run.song.sections,
      run.song.meta.bpm,
      dropIds
    );
    const distinct = countDistinctBodyMidis(run.song.sections, dropIds);

    expect(spread).toBeGreaterThan(0);
    expect(distinct).toBeGreaterThanOrEqual(3);

    const report = runEvaluationAgent(run.song, RIDDIM_STANDARD_16);
    expect(report.metrics.distinctBodyMidis).toBeGreaterThanOrEqual(3);
    expect(report.metrics.microTimingSpreadMs).toBeGreaterThan(0);
    expect(report.ok).toBe(true);
  });
});
