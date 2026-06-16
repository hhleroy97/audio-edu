import type { MixDefType } from "@/lib/schemas/mix";
import type { MixProfileType } from "@/lib/schemas/song";

export type MixLintResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const MAX_BUS: Record<MixProfileType, number> = {
  sub: 0.8,
  body: 0.65,
  top: 0.4,
  fx: 0.5,
};

/** Validate MixDef — sub protection, headroom caps, HPF rules. */
export function lintMixDef(
  mix: MixDefType,
  profilesByLayer: Map<string, MixProfileType>
): MixLintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (mix.songId.length === 0) {
    errors.push("mixDef requires songId");
  }

  for (const adj of mix.layers) {
    const profile = profilesByLayer.get(adj.layerId) ?? "body";

    if (profile === "sub" && adj.hpfHz !== undefined) {
      errors.push(`sub layer ${adj.layerId} must not set hpfHz`);
    }

    if (adj.busGain !== undefined && adj.busGain > MAX_BUS[profile]) {
      errors.push(
        `${adj.layerId} busGain ${adj.busGain} exceeds max for ${profile}`
      );
    }

    if (adj.hpfHz !== undefined && adj.lpfHz !== undefined) {
      if (adj.hpfHz >= adj.lpfHz) {
        errors.push(`${adj.layerId}: hpfHz must be below lpfHz`);
      }
    }

    if (profile === "body" && adj.hpfHz !== undefined && adj.hpfHz < 80) {
      warnings.push(`${adj.layerId} body HPF below 80 Hz may mud sub`);
    }
  }

  if (mix.master?.inputGain !== undefined && mix.master.inputGain > 0.95) {
    warnings.push("master inputGain > 0.95 leaves little headroom");
  }

  return { ok: errors.length === 0, errors, warnings };
}
