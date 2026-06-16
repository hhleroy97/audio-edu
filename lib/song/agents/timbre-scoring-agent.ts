import type { RulePackSectionSpecType } from "@/lib/schemas/rule-pack";
import type { RulePackSectionKindType } from "@/lib/schemas/section-kind";
import {
  ARCHETYPE_META,
  metaForPreset,
  presetsForBand,
  type MotionClassType,
  type PresetArchetypeMetaType,
  type SpectralBandType,
} from "@/lib/patch/presets/archetype-meta";
import { createSeededRng } from "../pattern/tonal-notes";

export type TimbreScoreContext = {
  layerId: "sub" | "body" | "top";
  sectionKind: RulePackSectionKindType;
  packId: string;
  seed: string;
  usedPresets: Set<string>;
  sectionId: string;
};

const KIND_MOTION: Partial<Record<RulePackSectionKindType, MotionClassType>> = {
  intro: "static",
  build: "wobble",
  drop: "dual-lfo",
  break: "static",
  outro: "static",
};

const LAYER_BAND: Record<"sub" | "body" | "top", SpectralBandType> = {
  sub: "sub",
  body: "body",
  top: "top",
};

const PACK_AFFINITY: Record<string, string[]> = {
  "riddim-yoi-16": ["yoi-talk-wobble", "formant"],
  "riddim-tearout-16": ["tearout-screech-sustain", "wt-morph-riddim", "tearout"],
  "riddim-infekt-16": ["infekt-constant-motion", "dual-lfo"],
  "riddim-sick-drop-16": ["harsh-square-fm", "vr-comb-macro-throw"],
};

function seededTieBreak(seed: string, presetId: string): number {
  const rng = createSeededRng(`${seed}:timbre:${presetId}`);
  return rng();
}

export function scorePreset(meta: PresetArchetypeMetaType, ctx: TimbreScoreContext): number {
  const targetBand = LAYER_BAND[ctx.layerId];
  let score = 0;

  if (meta.spectralBand === targetBand) score += 4;
  else score -= 6;

  const desiredMotion = KIND_MOTION[ctx.sectionKind];
  if (desiredMotion && meta.motionClass === desiredMotion) score += 3;
  if (ctx.sectionKind === "intro" && meta.motionClass === "wobble") score += 2;
  if (ctx.sectionKind === "break" && meta.motionClass === "static") score += 2;
  if (ctx.sectionKind === "drop" && meta.motionClass === "dual-lfo") score += 2;
  if (ctx.sectionKind === "intro" && meta.motionClass === "dual-lfo") score -= 2;

  if (ctx.usedPresets.has(meta.presetId)) score -= 8;

  const affinity = PACK_AFFINITY[ctx.packId];
  if (affinity?.some((tag) => meta.presetId.includes(tag) || meta.catalogSection.includes(tag))) {
    score += 2;
  }

  if (ctx.sectionId.includes("drop-b") && meta.motionClass === "screech") score += 1;

  score += seededTieBreak(ctx.seed, meta.presetId) * 0.05;
  return score;
}

export function pickScoredPreset(
  ctx: TimbreScoreContext,
  fallbackId: string
): string {
  const band = LAYER_BAND[ctx.layerId];
  const candidates = presetsForBand(band);
  if (candidates.length === 0) return fallbackId;

  const ranked = [...candidates].sort((a, b) => {
    const bonus = (meta: PresetArchetypeMetaType) =>
      meta.presetId === fallbackId && !ctx.usedPresets.has(meta.presetId) ? 6 : 0;
    const scoreA = scorePreset(a, ctx) + bonus(a);
    const scoreB = scorePreset(b, ctx) + bonus(b);
    return scoreB - scoreA;
  });
  return ranked[0]?.presetId ?? fallbackId;
}

export function pickScoredPresetForSection(
  spec: RulePackSectionSpecType,
  layerId: "sub" | "body" | "top",
  packId: string,
  seed: string,
  usedPresets: Set<string>,
  fallbackId: string
): string {
  if (layerId === "sub") {
    return pickScoredPreset(
      {
        layerId,
        sectionKind: spec.kind,
        packId,
        seed,
        usedPresets,
        sectionId: spec.id,
      },
      fallbackId
    );
  }

  return pickScoredPreset(
    {
      layerId,
      sectionKind: spec.kind,
      packId,
      seed,
      usedPresets,
      sectionId: spec.id,
    },
    fallbackId
  );
}

export function countUniqueArchetypePresets(presetIds: string[]): number {
  return new Set(
    presetIds.filter((id) => metaForPreset(id) || ARCHETYPE_META.some((m) => m.presetId === id))
  ).size;
}

export { ARCHETYPE_META, metaForPreset };
