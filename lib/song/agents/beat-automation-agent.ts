import type { PatternEventType, SectionDefType } from "@/lib/schemas/song";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";

export type BeatAutomationAgentInput = {
  pack: ArrangementRulePackType;
  sections: SectionDefType[];
  layerIds: Set<string>;
  seed: string;
};

export type BeatAutomationAgentResult = {
  sections: SectionDefType[];
};

type PhraseSlot = "a" | "b" | "c" | "d";

/** Phrase-slot keyed macro/filter automation (#120). */
export function runBeatAutomationAgent(
  input: BeatAutomationAgentInput
): BeatAutomationAgentResult {
  const { pack, layerIds } = input;
  const phraseLength = pack.rhythmPhrase?.phraseLengthBars ?? 4;
  const templates =
    pack.rhythmPhrase?.templates?.drop ?? (["a", "b", "c", "d"] as PhraseSlot[]);

  const sections = input.sections.map((section) => {
    const spec = pack.sections.find((s) => s.id === section.id);
    if (!spec || spec.kind !== "drop") return section;

    const extra: PatternEventType[] = [...section.events];
    const sectionBars = spec.endBar - spec.startBar;

    for (let bar = 0; bar < sectionBars; bar++) {
      const slot = (templates[bar % phraseLength] ?? "a") as PhraseSlot;
      const beat = bar * pack.beatsPerBar;

      if (slot === "b" && layerIds.has("top")) {
        extra.push({
          kind: "automation",
          beat,
          layer: "top",
          nodeId: "mfx-1",
          param: "mix",
          value: 0.62,
        });
      }

      if (slot === "c" && layerIds.has("body")) {
        extra.push({
          kind: "automation",
          beat,
          layer: "body",
          nodeId: "filt-1",
          param: "frequency",
          value: 560 + bar * 8,
        });
        extra.push({
          kind: "automation",
          beat,
          layer: "body",
          nodeId: "lfo-1",
          param: "depth",
          value: 320,
        });
      }

      if (slot === "d" && layerIds.has("body")) {
        extra.push({
          kind: "automation",
          beat,
          layer: "body",
          nodeId: "macro-1",
          param: "value",
          value: 0.55,
        });
        extra.push({
          kind: "automation",
          beat,
          layer: "body",
          nodeId: "dist-1",
          param: "drive",
          value: 6.4,
        });
      }
    }

    return { ...section, events: extra };
  });

  return { sections };
}

export function countPhraseMacroKeyframes(
  sections: SectionDefType[],
  pack: ArrangementRulePackType
): number {
  let count = 0;
  for (const section of sections) {
    const spec = pack.sections.find((s) => s.id === section.id);
    if (spec?.kind !== "drop") continue;
    for (const ev of section.events) {
      if (ev.kind !== "automation") continue;
      if (ev.nodeId === "macro-1" || ev.nodeId === "filt-1" || ev.nodeId === "mfx-1") {
        count++;
      }
    }
  }
  return count;
}

export function lintBeatAutomationAgent(result: BeatAutomationAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const section of result.sections) {
    for (const ev of section.events) {
      if (ev.kind === "automation" && !ev.nodeId) {
        errors.push(`beat automation missing nodeId in ${section.id}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
