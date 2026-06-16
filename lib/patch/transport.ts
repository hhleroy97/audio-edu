/** Riddim default tempo (EDMProd / Preset Drive guides). */
export const DEFAULT_TRANSPORT_BPM = 140;

export type LfoSyncDivision = "free" | "1/2" | "1/4" | "1/8" | "1/8t";

export const LFO_SYNC_OPTIONS: { id: LfoSyncDivision; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "1/2", label: "1/2" },
  { id: "1/4", label: "1/4" },
  { id: "1/8", label: "1/8" },
  { id: "1/8t", label: "1/8T" },
];

import { lfoRateMultiplier } from "./lfo-ratio";

/** One LFO cycle per division at `bpm` (quarter-note = one beat in 4/4). */
export function syncedLfoHz(bpm: number, sync: string): number {
  const beatHz = bpm / 60;
  switch (sync) {
    case "1/2":
      return beatHz * 0.5;
    case "1/4":
      return beatHz;
    case "1/8":
      return beatHz * 2;
    case "1/8t":
      return beatHz * 3;
    default:
      return beatHz;
  }
}

export function resolveLfoRateHz(
  params: Record<string, number | string | boolean>,
  transportBpm: number
): number {
  const sync = String(params.sync ?? "free");
  const base =
    sync === "free" ? Number(params.rate ?? 2) : syncedLfoHz(transportBpm, sync);
  return base * lfoRateMultiplier(params.rateRatio);
}
