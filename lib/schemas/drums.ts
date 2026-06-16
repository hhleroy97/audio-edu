import { z } from "zod";

/** Kick-triggered ducking on bass layers (Web Audio gain automation). */
export const SidechainDef = z.object({
  depth: z.number().min(0).max(1).default(0.32),
  attackSec: z.number().positive().default(0.004),
  releaseSec: z.number().positive().default(0.14),
  /** Layer ids to duck on kick — typically sub + body, never top-only FX. */
  targetLayers: z.array(z.string()).default(["sub", "body"]),
});

export type SidechainDefType = z.infer<typeof SidechainDef>;

export const DEFAULT_SIDECHAIN: SidechainDefType = SidechainDef.parse({});

/** Known procedural drum sample ids (phase 3 — optional WAV in /public/samples/riddim/). */
export const DRUM_SAMPLE_IDS = ["kick", "snare", "clap", "hat"] as const;
export type DrumSampleId = (typeof DRUM_SAMPLE_IDS)[number];

export function isDrumSampleId(id: string): id is DrumSampleId {
  return (DRUM_SAMPLE_IDS as readonly string[]).includes(id);
}
