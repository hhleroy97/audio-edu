import type { DrumHitType } from "@/lib/schemas/song";

/** Expand main snare hits into clap layer (#102). */
export function expandLayeredDrumHits(hits: DrumHitType[]): DrumHitType[] {
  const out: DrumHitType[] = [...hits];
  for (const hit of hits) {
    if (hit.sampleId === "snare" && (hit.velocity ?? 0.8) > 0.4) {
      const hasClap = out.some(
        (h) =>
          h.sampleId === "clap" &&
          Math.abs(h.beat - hit.beat) < 0.001
      );
      if (!hasClap) {
        out.push({
          ...hit,
          sampleId: "clap",
          velocity: (hit.velocity ?? 0.8) * 0.82,
          microShiftSec: (hit.microShiftSec ?? 0) + 0.003,
        });
      }
    }
  }
  return out.sort((a, b) => a.beat - b.beat);
}
