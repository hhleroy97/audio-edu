import type { DrumLaneDefType, SongDefType } from "@/lib/schemas/song";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";
import { DEFAULT_SIDECHAIN } from "@/lib/schemas/drums";
import { euclideanBeatHits } from "../pattern/euclidean";
import { buildRiddimDrumGrid } from "../drums/riddim-drum-grid";

export type DrumAgentInput = {
  pack: ArrangementRulePackType;
  draft: Pick<SongDefType, "sections" | "meta">;
  seed: string;
  /** Euclidean hat grid (optional). */
  hatEuclidean?: { pulses: number; steps: number };
};

export type DrumAgentResult = {
  drums: DrumLaneDefType;
};

/** Build drum lane from section layout + optional euclidean hats. */
export function runDrumAgent(input: DrumAgentInput): DrumAgentResult {
  const muteIds = new Set(input.pack.drumMuteSectionIds);
  const hits: DrumLaneDefType["hits"] = [];

  for (const section of input.draft.sections) {
    if (muteIds.has(section.id)) continue;
    const sectionBars = section.endBar - section.startBar;
    const sectionStartBeat = section.startBar * input.pack.beatsPerBar;
    const spec = input.pack.sections.find((s) => s.id === section.id);
    const includeSnare =
      spec?.kind === "drop" ||
      spec?.kind === "build" ||
      section.id.includes("drop");

    const sectionHits = buildRiddimDrumGrid({
      bars: sectionBars,
      beatsPerBar: input.pack.beatsPerBar,
      includeSnare,
    });
    for (const hit of sectionHits) {
      hits.push({ ...hit, beat: sectionStartBeat + hit.beat });
    }

    if (input.hatEuclidean && spec?.kind === "drop") {
      const hatBeats = euclideanBeatHits(
        input.hatEuclidean.pulses,
        input.hatEuclidean.steps,
        sectionBars,
        input.pack.beatsPerBar,
        sectionStartBeat,
        input.seed.length % input.hatEuclidean.steps
      );
      for (const beat of hatBeats) {
        hits.push({ beat, sampleId: "hat", velocity: 0.35 });
      }
    }
  }

  hits.sort((a, b) => a.beat - b.beat);

  return {
    drums: {
      hits,
      sidechain: DEFAULT_SIDECHAIN,
    },
  };
}

export function lintDrumAgent(result: DrumAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const hit of result.drums.hits) {
    if (!["kick", "snare", "hat"].includes(hit.sampleId)) {
      errors.push(`unknown drum sampleId: ${hit.sampleId}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
