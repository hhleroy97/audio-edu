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

const LAYER_ORDER = ["sub", "body", "top"] as const;

export type TimbreAgentResult = {
  layers: SongDefType["layers"];
  plans: SectionTimbrePlanType[];
};

function buildSongLayersFromPlans(
  plans: SectionTimbrePlanType[]
): SongDefType["layers"] {
  const byId = new Map<string, SongDefType["layers"][number]>();
  for (const plan of plans) {
    for (const layer of plan.layers) {
      if (!byId.has(layer.id)) {
        byId.set(layer.id, {
          id: layer.id,
          presetId: layer.presetId,
          mixProfile: layer.mixProfile,
          busGain: layer.busGain ?? 0.75,
          songGain: layer.songGain,
          defaultMidi: layer.defaultMidi,
        });
      }
    }
  }
  return LAYER_ORDER.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
}

function layersForSection(
  spec: RulePackSectionSpecType,
  timbre: TimbreDefType,
  _pack: ArrangementRulePackType
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
      : (kindPreset.top ?? timbre.defaultTopPresetId);

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

  const layers = buildSongLayersFromPlans(plans);

  return { layers, plans };
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
