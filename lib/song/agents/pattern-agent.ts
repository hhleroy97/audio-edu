import type { PatternEventType, SectionDefType } from "@/lib/schemas/song";
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

function buildSectionPatternEvents(
  spec: RulePackSectionSpecType,
  pack: ArrangementRulePackType,
  seed: string,
  config: PatternAgentConfigType,
  layerIds: Set<string>
): PatternEventType[] {
  const bars = sectionBarCount(spec);
  const rng = createSeededRng(`${seed}:${spec.id}`);
  const key = pack.key;
  const scale = pack.scale;

  const subMidi = (hitIndex: number) =>
    midiFromScaleDegree(
      key,
      scale,
      pickDegree(config.subDegrees, rng, hitIndex),
      config.subOctave
    );

  const bodyMidi = (hitIndex: number) =>
    midiFromScaleDegree(
      key,
      scale,
      pickDegree(config.bodyDegrees, rng, hitIndex + 7),
      config.bodyOctave
    );

  let hitIndex = 0;
  const withMidi = (
    events: PatternEventType[],
    layer: "sub" | "body" | "top"
  ): PatternEventType[] =>
    events.map((ev) => {
      if (ev.kind !== "note" || ev.layer !== layer) return ev;
      hitIndex++;
      const midi =
        layer === "sub"
          ? subMidi(hitIndex)
          : layer === "body"
            ? bodyMidi(hitIndex)
            : ev.midi;
      return { ...ev, midi };
    });

  const events: PatternEventType[] = [];

  switch (spec.kind) {
    case "intro":
      if (layerIds.has("sub")) {
        events.push(
          ...withMidi(buildSparseIntroSub(bars, pack.beatsPerBar, subMidi(0)), "sub")
        );
      }
      break;
    case "build":
      if (layerIds.has("sub")) {
        events.push(
          ...withMidi(buildSparseIntroSub(bars, pack.beatsPerBar, subMidi(0)), "sub")
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
  const config = { ...DEFAULT_CONFIG, ...input.config };
  const sections = input.sections.map((section) => {
    const spec = sectionSpecFor(input.pack, section.id);
    if (!spec) return section;
    const events = buildSectionPatternEvents(
      spec,
      input.pack,
      input.seed,
      config,
      input.layerIds
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
