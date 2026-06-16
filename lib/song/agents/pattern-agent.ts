import type { PatternEventType, SectionDefType } from "@/lib/schemas/song";
import type { SectionHarmonyPlanType } from "@/lib/schemas/harmony";
import type {
  ArrangementRulePackType,
  PatternAgentConfigType,
  RulePackSectionSpecType,
} from "@/lib/schemas/rule-pack";
import {
  buildHalftimeGroove,
  buildLayerGainRamp,
  buildSparseIntroSub,
  buildTopOffbeatStabs,
} from "../riddim/patterns";
import {
  createSeededRng,
  midiFromScaleDegree,
  pickDegree,
} from "../pattern/tonal-notes";

export type PatternAgentInput = {
  pack: ArrangementRulePackType;
  sections: SectionDefType[];
  seed: string;
  layerIds: Set<string>;
  harmonyPlans?: SectionHarmonyPlanType[];
  config?: Partial<PatternAgentConfigType>;
};

export type PatternAgentResult = {
  sections: SectionDefType[];
};

const DEFAULT_CONFIG: PatternAgentConfigType = {
  subOctave: 1,
  bodyOctave: 2,
  subDegrees: [1],
  bodyDegrees: [1, 4],
};

function sectionSpecFor(
  pack: ArrangementRulePackType,
  sectionId: string
): RulePackSectionSpecType | undefined {
  return pack.sections.find((s) => s.id === sectionId);
}

function sectionBarCount(spec: RulePackSectionSpecType): number {
  return spec.endBar - spec.startBar;
}

function degreesAtBeat(
  plan: SectionHarmonyPlanType | undefined,
  localBeat: number,
  beatsPerBar: number,
  config: PatternAgentConfigType
): { subDegrees: number[]; bodyDegrees: number[] } {
  if (plan?.barSlots?.length) {
    const barIdx = Math.floor(localBeat / beatsPerBar);
    const slot = plan.barSlots[barIdx % plan.barSlots.length];
    if (slot) {
      return {
        subDegrees: [slot.subDegree],
        bodyDegrees: slot.bodyDegrees,
      };
    }
  }
  return {
    subDegrees: config.subDegrees,
    bodyDegrees: config.bodyDegrees,
  };
}

function buildSectionPatternEvents(
  spec: RulePackSectionSpecType,
  pack: ArrangementRulePackType,
  seed: string,
  config: PatternAgentConfigType,
  layerIds: Set<string>,
  harmonyPlan?: SectionHarmonyPlanType
): PatternEventType[] {
  const bars = sectionBarCount(spec);
  const rng = createSeededRng(`${seed}:${spec.id}`);
  const key = pack.key;
  const scale = pack.harmony?.scaleOverride ?? pack.scale;
  const beatsPerBar = pack.beatsPerBar;

  let hitIndex = 0;
  const midiForLayer = (layer: "sub" | "body", localBeat: number) => {
    if (harmonyPlan?.barSlots?.length && layer === "sub") {
      const barIdx = Math.floor(localBeat / beatsPerBar);
      const slot = harmonyPlan.barSlots[barIdx % harmonyPlan.barSlots.length];
      if (slot?.rootMidi !== undefined) return slot.rootMidi;
    }
    const degrees = degreesAtBeat(harmonyPlan, localBeat, beatsPerBar, config);
    const pool = layer === "sub" ? degrees.subDegrees : degrees.bodyDegrees;
    const octave = layer === "sub" ? config.subOctave : config.bodyOctave;
    hitIndex++;
    return midiFromScaleDegree(
      key,
      scale,
      pickDegree(pool, rng, hitIndex + (layer === "body" ? 7 : 0)),
      octave
    );
  };

  const withMidi = (
    events: PatternEventType[],
    layer: "sub" | "body" | "top"
  ): PatternEventType[] =>
    events.map((ev) => {
      if (ev.kind !== "note" || ev.layer !== layer) return ev;
      const midi =
        layer === "sub"
          ? midiForLayer("sub", ev.beat)
          : layer === "body"
            ? midiForLayer("body", ev.beat)
            : ev.midi;
      return { ...ev, midi };
    });

  const events: PatternEventType[] = [];

  switch (spec.kind) {
    case "intro":
      if (layerIds.has("sub")) {
        events.push(
          ...withMidi(
            buildSparseIntroSub(
              bars,
              pack.beatsPerBar,
              midiForLayer("sub", 0)
            ),
            "sub"
          )
        );
      }
      break;
    case "build":
      if (layerIds.has("sub")) {
        events.push(
          ...withMidi(
            buildSparseIntroSub(
              bars,
              pack.beatsPerBar,
              midiForLayer("sub", 0)
            ),
            "sub"
          )
        );
      }
      if (layerIds.has("body")) {
        events.push(
          ...buildLayerGainRamp({
            layer: "body",
            startGain: 0,
            endGain: 0.28,
            startBeat: 0,
            endBeat: Math.max(1, bars * pack.beatsPerBar - 1),
          })
        );
        events.push(
          ...withMidi(
            buildHalftimeGroove({
              bars,
              beatsPerBar: pack.beatsPerBar,
              layers: [{ layer: "body", durationBeats: 1.5 }],
              bodyDurationScale: 0.9,
            }),
            "body"
          )
        );
      }
      break;
    case "drop": {
      if (layerIds.has("body")) {
        events.push({
          kind: "layerGain",
          beat: 0,
          layer: "body",
          gain: spec.bodyPresetId ? 0.45 : 0.48,
        });
      }
      if (spec.bodyPresetId && layerIds.has("body")) {
        events.push({
          kind: "layerPreset",
          beat: 0,
          layer: "body",
          presetId: spec.bodyPresetId,
        });
      }
      if (spec.includeTop && layerIds.has("top")) {
        events.push({
          kind: "layerGain",
          beat: 0,
          layer: "top",
          gain: 0.22,
        });
      }
      if (layerIds.has("sub") || layerIds.has("body")) {
        const grooveLayers: { layer: string; durationBeats: number }[] = [];
        if (layerIds.has("sub")) {
          grooveLayers.push({ layer: "sub", durationBeats: 1.92 });
        }
        if (layerIds.has("body")) {
          grooveLayers.push({ layer: "body", durationBeats: 1.68 });
        }
        let groove = buildHalftimeGroove({
          bars,
          beatsPerBar: pack.beatsPerBar,
          layers: grooveLayers,
        });
        if (layerIds.has("sub")) groove = withMidi(groove, "sub");
        if (layerIds.has("body")) groove = withMidi(groove, "body");
        events.push(...groove);
      }
      if (spec.includeTop && layerIds.has("top")) {
        events.push(...buildTopOffbeatStabs(0, bars, pack.beatsPerBar));
      }
      break;
    }
    case "break":
      if (layerIds.has("sub")) {
        events.push(
          ...withMidi(
            buildHalftimeGroove({
              bars,
              beatsPerBar: pack.beatsPerBar,
              layers: [{ layer: "sub", durationBeats: 1.75 }],
            }),
            "sub"
          )
        );
      }
      break;
    case "outro":
      if (layerIds.has("body")) {
        events.push({ kind: "layerGain", beat: 0, layer: "body", gain: 0 });
      }
      if (layerIds.has("top")) {
        events.push({ kind: "layerGain", beat: 0, layer: "top", gain: 0 });
      }
      if (layerIds.has("sub")) {
        events.push({ kind: "layerGain", beat: 0, layer: "sub", gain: 0.45 });
      }
      if (layerIds.has("sub")) {
        events.push(
          ...withMidi(
            buildHalftimeGroove({
              bars,
              beatsPerBar: pack.beatsPerBar,
              layers: [{ layer: "sub", durationBeats: 1.4 }],
            }),
            "sub"
          )
        );
      }
      break;
  }

  return events;
}

/** Generate pattern events per section using tonal scale degrees + riddim grids. */
export function runPatternAgent(input: PatternAgentInput): PatternAgentResult {
  const planBySection = new Map(
    (input.harmonyPlans ?? []).map((p) => [p.sectionId, p])
  );

  const sections = input.sections.map((section) => {
    const spec = sectionSpecFor(input.pack, section.id);
    if (!spec) return section;

    const plan = planBySection.get(section.id);
    const config: PatternAgentConfigType = plan
      ? {
          subOctave: input.pack.harmony?.subOctave ?? DEFAULT_CONFIG.subOctave,
          bodyOctave: input.pack.harmony?.bodyOctave ?? DEFAULT_CONFIG.bodyOctave,
          subDegrees: plan.subDegrees,
          bodyDegrees: plan.bodyDegrees,
        }
      : { ...DEFAULT_CONFIG, ...input.config };

    const events = buildSectionPatternEvents(
      spec,
      input.pack,
      input.seed,
      config,
      input.layerIds,
      plan
    );
    return { ...section, events };
  });
  return { sections };
}

export function lintPatternAgent(
  result: PatternAgentResult,
  maxBeat: number,
  beatsPerBar = 4
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const section of result.sections) {
    const sectionEndBeat = section.endBar * beatsPerBar;
    for (const ev of section.events) {
      const absBeat = section.startBar * beatsPerBar + ev.beat;
      if (absBeat >= maxBeat + 0.001) {
        errors.push(`pattern overflow in ${section.id} at beat ${ev.beat}`);
      }
      if (absBeat >= sectionEndBeat + 0.001) {
        errors.push(`pattern past section end in ${section.id}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
