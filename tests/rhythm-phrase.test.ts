import { describe, expect, it } from "vitest";
import {
  buildRiddimPhraseGrid,
  countPhraseVariationBars,
  PHRASE_SLOT_OVERRIDES,
} from "@/lib/song/drums/riddim-pocket";
import { runArrangement } from "@/lib/song/agents";
import { RIDDIM_STANDARD_16 } from "@/lib/song/agents/rule-packs";
import { runEvaluationAgent } from "@/lib/song/agents/evaluation-agent";

describe("RhythmPhraseDef (#111)", () => {
  it("defines A/B/C/D phrase slot overrides", () => {
    expect(PHRASE_SLOT_OVERRIDES.a).toBeDefined();
    expect(PHRASE_SLOT_OVERRIDES.c?.hatRoll).toBe(true);
  });

  it("buildRiddimPhraseGrid cycles four bar variants", () => {
    const hits = buildRiddimPhraseGrid({
      bars: 4,
      slots: ["a", "b", "c", "d"],
      phraseLengthBars: 4,
      includeSnare: true,
      seed: "phrase-unit",
    });
    expect(hits.length).toBeGreaterThan(16);
    expect(countPhraseVariationBars(hits, 4, 4)).toBeGreaterThanOrEqual(4);
  });

  it("passes phrase variation eval on full arrangement", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "phrase-eval",
    });
    const report = runEvaluationAgent(run.song, RIDDIM_STANDARD_16);
    expect(report.metrics.phraseVariationBars).toBeGreaterThanOrEqual(4);
    expect(report.ok).toBe(true);
  });
});
