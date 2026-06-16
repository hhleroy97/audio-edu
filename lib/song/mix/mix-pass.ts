import type { MixDefType } from "@/lib/schemas/mix";
import { MixDef } from "@/lib/schemas/mix";
import type { MixProfileType, SongDefType } from "@/lib/schemas/song";
import { applyMixDefaultsToLayer } from "../multibus/mix-profiles";
import type { SongLayerEngine } from "../multibus/song-layer-engine";
import { analyzeSongMix, type SongMixAnalysis } from "./analyze-song";
import { applyMixDef } from "./apply-mix";
import { lintMixDef } from "./lint-mix";
import { proposeMixDef } from "./propose-mix";

export type MixPassResult = {
  mix: MixDefType;
  analysis: SongMixAnalysis;
  lint: ReturnType<typeof lintMixDef>;
  applied: boolean;
};

export type MixPassOptions = {
  sampleRate?: number;
  engine?: SongLayerEngine;
  apply?: boolean;
};

function profileMap(song: SongDefType): Map<string, MixProfileType> {
  const map = new Map<string, MixProfileType>();
  for (const l of song.layers) {
    const def = applyMixDefaultsToLayer(l);
    map.set(l.id, def.mixProfile ?? "body");
  }
  return map;
}

/**
 * Mix pass pipeline: analyze stems → propose MixDef → lint → optional apply.
 * Respects gate: only auto-applies when mix.gate === "auto".
 */
export async function runMixPass(
  song: SongDefType,
  options: MixPassOptions = {}
): Promise<MixPassResult> {
  const sampleRate = options.sampleRate ?? 48000;
  const analysis = await analyzeSongMix(song, sampleRate);
  const proposed = proposeMixDef(song, analysis);
  const lint = lintMixDef(proposed, profileMap(song));

  if (!lint.ok) {
    throw new Error(`mix lint failed: ${lint.errors.join("; ")}`);
  }

  const mix = MixDef.parse(proposed);
  let applied = false;
  const shouldApply =
    options.apply === true ||
    (options.apply !== false && mix.gate === "auto" && options.engine);

  if (shouldApply && options.engine) {
    applyMixDef(options.engine, mix);
    applied = true;
  }

  return { mix, analysis, lint, applied };
}
