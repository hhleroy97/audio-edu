import type { DrumHitType, DrumLaneDefType, SongDefType } from "@/lib/schemas/song";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";
import { DEFAULT_SIDECHAIN } from "@/lib/schemas/drums";
import {
  buildRiddimPhraseGrid,
  buildRiddimPocketGrid,
  phraseSlotsForSection,
} from "../drums/riddim-pocket";
import { expandLayeredDrumHits } from "../drums/sample-layers";

export type DrumAgentInput = {
  pack: ArrangementRulePackType;
  draft: Pick<SongDefType, "sections" | "meta">;
  seed: string;
  /** Extra hits from GrooveAgent. */
  drumExtras?: DrumHitType[];
};

export type DrumAgentResult = {
  drums: DrumLaneDefType;
};

/** Build drum lane from riddim pocket + groove extras (#101–102). */
export function runDrumAgent(input: DrumAgentInput): DrumAgentResult {
  const muteIds = new Set(input.pack.drumMuteSectionIds);
  const hits: DrumHitType[] = [];

  for (const section of input.draft.sections) {
    if (muteIds.has(section.id)) continue;
    const sectionBars = section.endBar - section.startBar;
    const sectionStartBeat = section.startBar * input.pack.beatsPerBar;
    const spec = input.pack.sections.find((s) => s.id === section.id);
    const includeSnare =
      spec?.kind === "drop" ||
      spec?.kind === "build" ||
      section.id.includes("drop");

    const phraseSlots = phraseSlotsForSection(
      input.pack.rhythmPhrase?.templates,
      spec?.kind ?? "drop"
    );
    const phraseLength = input.pack.rhythmPhrase?.phraseLengthBars ?? 4;

    const sectionHits =
      phraseSlots?.length && spec?.kind === "drop"
        ? buildRiddimPhraseGrid({
            bars: sectionBars,
            beatsPerBar: input.pack.beatsPerBar,
            includeSnare,
            seed: `${input.seed}:${section.id}`,
            pocket: input.pack.rhythm,
            slots: phraseSlots,
            phraseLengthBars: phraseLength,
          })
        : buildRiddimPocketGrid({
            bars: sectionBars,
            beatsPerBar: input.pack.beatsPerBar,
            includeSnare,
            seed: `${input.seed}:${section.id}`,
            pocket: input.pack.rhythm,
          });
    for (const hit of sectionHits) {
      hits.push({ ...hit, beat: sectionStartBeat + hit.beat });
    }
  }

  if (input.drumExtras?.length) {
    hits.push(...input.drumExtras);
  }

  hits.sort((a, b) => a.beat - b.beat);
  const layered = expandLayeredDrumHits(hits);

  return {
    drums: {
      hits: layered,
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
    if (!["kick", "snare", "clap", "hat"].includes(hit.sampleId)) {
      errors.push(`unknown drum sampleId: ${hit.sampleId}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
