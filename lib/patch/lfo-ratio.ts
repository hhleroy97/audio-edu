export type LfoRateRatio = "1" | "half" | "double";

export const LFO_RATE_RATIO_OPTIONS = [
  { id: "1" as const, label: "1×" },
  { id: "half" as const, label: "½×" },
  { id: "double" as const, label: "2×" },
];

export function lfoRateMultiplier(rateRatio: string | number | boolean | undefined): number {
  const r = String(rateRatio ?? "1");
  if (r === "half" || r === "0.5") return 0.5;
  if (r === "double" || r === "2") return 2;
  return 1;
}
