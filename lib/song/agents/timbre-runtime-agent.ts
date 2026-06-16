import type { PatternEventType, SectionDefType } from "@/lib/schemas/song";
import type { SectionTimbrePlanType } from "@/lib/schemas/timbre";

const DEFAULT_LAYER_GAIN: Record<string, number> = {
  sub: 0.82,
  body: 0.58,
  top: 0.38,
};

export type TimbreRuntimeAgentInput = {
  sections: SectionDefType[];
  plans: SectionTimbrePlanType[];
  layerIds: Set<string>;
};

export type TimbreRuntimeAgentResult = {
  sections: SectionDefType[];
};

/** Emit layerPreset + layerGain at each section boundary from timbre plans (#108). */
export function runTimbreRuntimeAgent(
  input: TimbreRuntimeAgentInput
): TimbreRuntimeAgentResult {
  const planBySection = new Map(input.plans.map((p) => [p.sectionId, p]));
  const orderedLayerIds = ["sub", "body", "top"].filter((id) =>
    input.layerIds.has(id)
  );

  const sections = input.sections.map((section) => {
    const plan = planBySection.get(section.id);
    if (!plan) return section;

    const runtimeEvents: PatternEventType[] = [];
    const activeLayerIds = new Set(plan.layers.map((l) => l.id));

    for (const layer of plan.layers) {
      if (!input.layerIds.has(layer.id)) continue;
      runtimeEvents.push({
        kind: "layerPreset",
        beat: 0,
        layer: layer.id,
        presetId: layer.presetId,
      });
      runtimeEvents.push({
        kind: "layerGain",
        beat: 0,
        layer: layer.id,
        gain: layer.songGain ?? DEFAULT_LAYER_GAIN[layer.id] ?? 0.5,
      });
    }

    for (const layerId of orderedLayerIds) {
      if (!activeLayerIds.has(layerId)) {
        runtimeEvents.push({
          kind: "layerGain",
          beat: 0,
          layer: layerId,
          gain: 0,
        });
      }
    }

    return {
      ...section,
      events: [...runtimeEvents, ...section.events],
    };
  });

  return { sections };
}

export function lintTimbreRuntimeAgent(
  result: TimbreRuntimeAgentResult,
  minSections = 1
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  let presetEvents = 0;
  for (const section of result.sections) {
    presetEvents += section.events.filter((e) => e.kind === "layerPreset").length;
  }
  if (presetEvents < minSections) {
    errors.push(`timbre runtime: expected preset events, got ${presetEvents}`);
  }
  return { ok: errors.length === 0, errors };
}

export function countSectionPresetEvents(sections: SectionDefType[]): number {
  return sections.reduce(
    (n, section) =>
      n + section.events.filter((ev) => ev.kind === "layerPreset").length,
    0
  );
}
