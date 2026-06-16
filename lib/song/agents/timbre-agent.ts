import type { SongDefType } from "@/lib/schemas/song";
import type { SectionTimbrePlanType, TimbreDefType } from "@/lib/schemas/timbre";
import type {
  ArrangementRulePackType,
  RulePackSectionSpecType,
} from "@/lib/schemas/rule-pack";
import { DEFAULT_BODY_MIDI, DEFAULT_SUB_MIDI } from "../riddim/patterns";

const DEFAULT_TIMBRE: TimbreDefType = {
  defaultTopPresetId: "pro-metallic-comb",
  bySectionKind: {
    intro: { sub: "clean-sub", body: "subfiltronik-loop", top: null },
    build: { sub: "clean-sub", body: "reese-riddim-body", top: "pro-metallic-comb" },
    drop: { sub: "clean-sub", body: "hydraulic-press-wobble", top: "pro-metallic-comb" },
    break: { sub: "clean-sub", body: null, top: null },
    outro: { sub: "clean-sub", body: "subfiltronik-loop", top: null },
  },
  dropBBodySwap: "harsh-square-fm",
};

export type TimbreAgentResult = {
  layers: SongDefType["layers"];
  plans: SectionTimbrePlanType[];
};

function layersForSection(
  spec: RulePackSectionSpecType,
  timbre: TimbreDefType,
  pack: ArrangementRulePackType
): SectionTimbrePlanType {
  const kind = spec.kind;
  const kindPreset = timbre.bySectionKind?.[kind] ?? {
    sub: "clean-sub",
    body: "hydraulic-press-wobble",
    top: null,
  };

  let bodyId =
    spec.bodyPresetId ??
    kindPreset.body ??
    "hydraulic-press-wobble";

  if (spec.id.includes("drop-b") && timbre.dropBBodySwap) {
    bodyId = spec.bodyPresetId ?? timbre.dropBBodySwap;
  }

  const layers: SectionTimbrePlanType["layers"] = [
    {
      id: "sub",
      presetId: kindPreset.sub,
      mixProfile: "sub",
      busGain: 0.72,
      songGain: 0.82,
      defaultMidi: DEFAULT_SUB_MIDI,
    },
  ];

  if (bodyId && !spec.muteLayers?.includes("body")) {
    layers.push({
      id: "body",
      presetId: bodyId,
      mixProfile: "body",
      busGain: 0.48,
      songGain: 0.58,
      defaultMidi: DEFAULT_BODY_MIDI,
    });
  }

  const topId =
    spec.includeTop === false
      ? null
      : timbre.defaultTopPresetId;

  if (
    topId &&
    (kind === "drop" || kind === "build") &&
    !spec.muteLayers?.includes("top")
  ) {
    layers.push({
      id: "top",
      presetId: topId,
      mixProfile: "top",
      busGain: 0.32,
      songGain: 0.38,
      defaultMidi: DEFAULT_BODY_MIDI + 12,
    });
  }

  return {
    sectionId: spec.id,
    layers,
    bodyPresetOverride: bodyId,
  };
}

/** Map section kinds → archetype preset stacks (#103). */
export function runTimbreAgent(
  pack: ArrangementRulePackType
): TimbreAgentResult {
  const timbre = { ...DEFAULT_TIMBRE, ...pack.timbre };

  const plans = pack.sections.map((spec) =>
    layersForSection(spec, timbre, pack)
  );

  const dropPlan =
    plans.find((p) => p.sectionId.includes("drop-a")) ??
    plans.find((p) => pack.sections.find((s) => s.id === p.sectionId)?.kind === "drop") ??
    plans[0];

  const layers = dropPlan?.layers ?? [
    {
      id: "sub",
      presetId: "clean-sub",
      mixProfile: "sub" as const,
      busGain: 0.72,
      songGain: 0.82,
      defaultMidi: DEFAULT_SUB_MIDI,
    },
    {
      id: "body",
      presetId: "hydraulic-press-wobble",
      mixProfile: "body" as const,
      busGain: 0.48,
      songGain: 0.58,
      defaultMidi: DEFAULT_BODY_MIDI,
    },
  ];

  return {
    layers: layers.map((l) => ({
      id: l.id,
      presetId: l.presetId,
      mixProfile: l.mixProfile,
      busGain: l.busGain ?? 0.75,
      songGain: l.songGain,
      defaultMidi: l.defaultMidi,
    })),
    plans,
  };
}

export function lintTimbreAgent(result: TimbreAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (result.layers.length < 2) {
    errors.push("timbre agent requires at least sub + body layers");
  }
  for (const layer of result.layers) {
    if (!layer.presetId) errors.push(`layer ${layer.id} missing presetId`);
  }
  return { ok: errors.length === 0, errors };
}

export function presetForSectionLayer(
  plans: SectionTimbrePlanType[],
  sectionId: string,
  layerId: string
): string | undefined {
  const plan = plans.find((p) => p.sectionId === sectionId);
  return plan?.layers.find((l) => l.id === layerId)?.presetId;
}

export { DEFAULT_TIMBRE };
