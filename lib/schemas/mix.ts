import { z } from "zod";
import { MixProfile } from "./song";

/** Per-layer metrics from offline stem analysis (mix pass input). */
export const StemMetrics = z.object({
  layerId: z.string(),
  mixProfile: MixProfile.optional(),
  rms: z.number().min(0),
  peak: z.number().min(0),
  centroidHz: z.number().min(0),
});

/** Proposed per-layer mix adjustment (mix pass output). */
export const LayerMixAdjust = z.object({
  layerId: z.string(),
  busGain: z.number().min(0).max(1).optional(),
  songGain: z.number().min(0).max(1).optional(),
  hpfHz: z.number().min(20).max(20000).optional(),
  lpfHz: z.number().min(20).max(20000).optional(),
  rationale: z.string().optional(),
});

export const MasterMixAdjust = z.object({
  inputGain: z.number().min(0).max(1).optional(),
  glueThreshold: z.number().max(0).optional(),
  limiterThreshold: z.number().max(0).optional(),
});

export const MixAnalysis = z.object({
  measuredAt: z.string(),
  sampleRate: z.number().int().positive(),
  stems: z.array(StemMetrics),
  masterPeak: z.number().min(0).optional(),
  masterRms: z.number().min(0).optional(),
});

/** Validated mix pass artifact — gated before publish. */
export const MixDef = z.object({
  songId: z.string(),
  schemaVersion: z.number().int().min(1).default(1),
  layers: z.array(LayerMixAdjust),
  master: MasterMixAdjust.optional(),
  analysis: MixAnalysis.optional(),
  gate: z.enum(["auto", "human-review"]).default("human-review"),
});

export type StemMetricsType = z.infer<typeof StemMetrics>;
export type LayerMixAdjustType = z.infer<typeof LayerMixAdjust>;
export type MasterMixAdjustType = z.infer<typeof MasterMixAdjust>;
export type MixAnalysisType = z.infer<typeof MixAnalysis>;
export type MixDefType = z.infer<typeof MixDef>;
