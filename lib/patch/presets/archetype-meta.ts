import { z } from "zod";

export const SpectralBand = z.enum(["sub", "body", "top"]);
export type SpectralBandType = z.infer<typeof SpectralBand>;

export const MotionClass = z.enum([
  "static",
  "wobble",
  "dual-lfo",
  "morph",
  "screech",
  "formant",
  "metallic",
]);
export type MotionClassType = z.infer<typeof MotionClass>;

export const PresetArchetypeMeta = z.object({
  presetId: z.string(),
  catalogSection: z.string(),
  spectralBand: SpectralBand,
  motionClass: MotionClass,
  harmonicRichness: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  techniqueTags: z.array(z.string()),
});

export type PresetArchetypeMetaType = z.infer<typeof PresetArchetypeMeta>;

/** Synthesis metadata for TimbreScoringAgent (#118). */
export const ARCHETYPE_META: PresetArchetypeMetaType[] = PresetArchetypeMeta.array().parse([
  {
    presetId: "clean-sub",
    catalogSection: "legacy",
    spectralBand: "sub",
    motionClass: "static",
    harmonicRichness: 1,
    techniqueTags: ["technique:sub-layer"],
  },
  {
    presetId: "hydraulic-press-wobble",
    catalogSection: "groove",
    spectralBand: "body",
    motionClass: "wobble",
    harmonicRichness: 2,
    techniqueTags: ["technique:wobble-lfo-cutoff", "technique:multiband-distortion"],
  },
  {
    presetId: "subfiltronik-loop",
    catalogSection: "groove",
    spectralBand: "body",
    motionClass: "wobble",
    harmonicRichness: 2,
    techniqueTags: ["technique:fm-growl", "technique:wobble-lfo-cutoff"],
  },
  {
    presetId: "triplet-offgrid-wobble",
    catalogSection: "groove",
    spectralBand: "body",
    motionClass: "wobble",
    harmonicRichness: 2,
    techniqueTags: ["technique:wobble-lfo-cutoff"],
  },
  {
    presetId: "harsh-square-fm",
    catalogSection: "fm",
    spectralBand: "body",
    motionClass: "dual-lfo",
    harmonicRichness: 3,
    techniqueTags: ["technique:fm-growl", "technique:wobble-lfo-cutoff"],
  },
  {
    presetId: "pitch-screech-pluck",
    catalogSection: "fm",
    spectralBand: "body",
    motionClass: "screech",
    harmonicRichness: 2,
    techniqueTags: ["technique:pitch-envelope", "technique:fm-growl"],
  },
  {
    presetId: "infekt-constant-motion",
    catalogSection: "fm",
    spectralBand: "body",
    motionClass: "dual-lfo",
    harmonicRichness: 3,
    techniqueTags: ["technique:mod-fx-phaser", "technique:dual-lfo-chain"],
  },
  {
    presetId: "yoi-talk-wobble",
    catalogSection: "formant",
    spectralBand: "body",
    motionClass: "formant",
    harmonicRichness: 2,
    techniqueTags: ["technique:formant-filter", "technique:wobble-lfo-cutoff"],
  },
  {
    presetId: "dsf-allpass-comb",
    catalogSection: "metallic",
    spectralBand: "top",
    motionClass: "metallic",
    harmonicRichness: 3,
    techniqueTags: ["technique:comb-metallic", "technique:mod-fx-phaser"],
  },
  {
    presetId: "vr-comb-macro-throw",
    catalogSection: "metallic",
    spectralBand: "body",
    motionClass: "metallic",
    harmonicRichness: 3,
    techniqueTags: ["technique:comb-metallic", "component:macro"],
  },
  {
    presetId: "reese-riddim-body",
    catalogSection: "layer-stack",
    spectralBand: "body",
    motionClass: "wobble",
    harmonicRichness: 3,
    techniqueTags: ["technique:saw-body", "technique:unison-spread"],
  },
  {
    presetId: "full-stack-gnarl",
    catalogSection: "layer-stack",
    spectralBand: "body",
    motionClass: "dual-lfo",
    harmonicRichness: 3,
    techniqueTags: ["technique:layer-stack-three", "technique:fm-growl"],
  },
  {
    presetId: "tearout-screech-sustain",
    catalogSection: "tearout",
    spectralBand: "body",
    motionClass: "screech",
    harmonicRichness: 3,
    techniqueTags: ["technique:comb-metallic", "technique:fm-growl"],
  },
  {
    presetId: "wt-morph-riddim",
    catalogSection: "tearout",
    spectralBand: "body",
    motionClass: "morph",
    harmonicRichness: 2,
    techniqueTags: ["technique:wavetable-morph", "technique:wobble-lfo-cutoff"],
  },
  {
    presetId: "pro-metallic-comb",
    catalogSection: "legacy",
    spectralBand: "top",
    motionClass: "metallic",
    harmonicRichness: 2,
    techniqueTags: ["technique:comb-metallic", "technique:mod-fx-phaser"],
  },
  {
    presetId: "pro-dual-lfo-growl",
    catalogSection: "legacy",
    spectralBand: "body",
    motionClass: "dual-lfo",
    harmonicRichness: 3,
    techniqueTags: ["technique:fm-growl", "technique:dual-lfo-chain"],
  },
]);

export const ARCHETYPE_META_BY_ID = new Map(
  ARCHETYPE_META.map((meta) => [meta.presetId, meta])
);

export function metaForPreset(presetId: string): PresetArchetypeMetaType | undefined {
  return ARCHETYPE_META_BY_ID.get(presetId);
}

export function presetsForBand(band: SpectralBandType): PresetArchetypeMetaType[] {
  return ARCHETYPE_META.filter((meta) => meta.spectralBand === band);
}
