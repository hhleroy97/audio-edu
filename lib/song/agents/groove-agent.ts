import type { DrumHitType, PatternEventType, SectionDefType } from "@/lib/schemas/song";
import type { GrooveDefType } from "@/lib/schemas/harmony";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";
import { createSeededRng } from "../pattern/tonal-notes";
import { euclideanBeatHits } from "../pattern/euclidean";

export type GrooveAgentInput = {
  pack: ArrangementRulePackType;
  sections: SectionDefType[];
  seed: string;
  layerIds: Set<string>;
};

export type GrooveAgentResult = {
  sections: SectionDefType[];
  drumExtras: DrumHitType[];
};

/** Ghost snares, euclidean hats, cat phrase splits (#91). */
export function runGrooveAgent(input: GrooveAgentInput): GrooveAgentResult {
  const groove: GrooveDefType = input.pack.groove ?? {
    ghostSnare: { enabled: true, velocity: 0.28, beatInBar: 3 },
    hatEuclidean: { pulses: 5, steps: 16 },
    enableCatPhrases: true,
  };

  const drumExtras: DrumHitType[] = [];
  const rng = createSeededRng(`${input.seed}:groove`);
  const beatsPerBar = input.pack.beatsPerBar;

  const sections = input.sections.map((section) => {
    const spec = input.pack.sections.find((s) => s.id === section.id);
    if (!spec) return section;

    let events = [...section.events];
    const sectionBars = section.endBar - section.startBar;
    const sectionStartBeat = section.startBar * beatsPerBar;

    if (
      groove.enableCatPhrases &&
      spec.combinator === "cat" &&
      events.filter((e) => e.kind === "note").length > 2
    ) {
      const midpoint = Math.floor((sectionBars * beatsPerBar) / 2);
      events = events.map((ev) => {
        if (ev.kind !== "note" || ev.beat < midpoint) return ev;
        return { ...ev, velocity: (ev.velocity ?? 0.8) * 0.85 };
      });
    }

    if (groove.ghostSnare?.enabled && spec.kind === "drop") {
      for (let bar = 0; bar < sectionBars; bar++) {
        if (rng() < 0.55) {
          drumExtras.push({
            beat:
              sectionStartBeat +
              bar * beatsPerBar +
              (groove.ghostSnare.beatInBar % beatsPerBar),
            sampleId: "snare",
            velocity: groove.ghostSnare.velocity,
          });
        }
      }
    }

    if (groove.hatEuclidean && spec.kind === "drop") {
      const hatBeats = euclideanBeatHits(
        groove.hatEuclidean.pulses,
        groove.hatEuclidean.steps,
        sectionBars,
        beatsPerBar,
        sectionStartBeat,
        input.seed.length % groove.hatEuclidean.steps
      );
      for (const beat of hatBeats) {
        drumExtras.push({ beat, sampleId: "hat", velocity: 0.32 });
      }
    }

    return { ...section, events };
  });

  drumExtras.sort((a, b) => a.beat - b.beat);
  return { sections, drumExtras };
}

export function lintGrooveAgent(result: GrooveAgentResult): {
  ok: boolean;
  errors: string[];
} {
  for (const hit of result.drumExtras) {
    if (!["kick", "snare", "hat"].includes(hit.sampleId)) {
      return { ok: false, errors: [`unknown groove drum: ${hit.sampleId}`] };
    }
  }
  return { ok: true, errors: [] };
}
