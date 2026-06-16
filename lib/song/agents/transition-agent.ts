import type { PatternEventType, SectionDefType } from "@/lib/schemas/song";
import type { TransitionDefType } from "@/lib/schemas/harmony";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";

export type TransitionAgentInput = {
  pack: ArrangementRulePackType;
  sections: SectionDefType[];
};

export type TransitionAgentResult = {
  sections: SectionDefType[];
};

/** Pre-drop dips and build-tail filter sweeps (#94, #99). */
export function runTransitionAgent(
  input: TransitionAgentInput
): TransitionAgentResult {
  const transition: TransitionDefType = input.pack.transition ?? {
    preDropBodyDipBeats: 2,
    preDropBodyGain: 0.12,
    buildFilterSweep: {
      nodeId: "filt-1",
      param: "frequency",
      startHz: 800,
      endHz: 220,
    },
  };

  const beatsPerBar = input.pack.beatsPerBar;
  const sections = input.sections.map((section) => {
    const spec = input.pack.sections.find((s) => s.id === section.id);
    if (!spec) return section;

    const extra: PatternEventType[] = [];
    const sectionBars = section.endBar - section.startBar;

    if (spec.kind === "build" && sectionBars > 0) {
      const tailBeat = Math.max(0, sectionBars * beatsPerBar - transition.preDropBodyDipBeats);
      extra.push({
        kind: "layerGain",
        beat: tailBeat,
        layer: "body",
        gain: transition.preDropBodyGain,
      });

      if (transition.buildFilterSweep) {
        const sweepStart = Math.max(0, sectionBars * beatsPerBar - beatsPerBar);
        extra.push({
          kind: "automation",
          beat: sweepStart,
          layer: "body",
          nodeId: transition.buildFilterSweep.nodeId,
          param: transition.buildFilterSweep.param,
          value: transition.buildFilterSweep.endHz,
          durationBeats: beatsPerBar,
        });
      }
    }

    if (extra.length === 0) return section;
    return { ...section, events: [...section.events, ...extra] };
  });

  return { sections };
}

export function lintTransitionAgent(result: TransitionAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const section of result.sections) {
    for (const ev of section.events) {
      if (ev.kind === "automation" && !ev.nodeId) {
        errors.push(`transition automation missing nodeId in ${section.id}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
