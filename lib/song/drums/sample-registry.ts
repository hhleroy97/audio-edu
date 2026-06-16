import type { DrumSampleId } from "@/lib/schemas/drums";

/** Optional WAV paths under /public — procedural fallback when missing (phase 98). */
export const DRUM_SAMPLE_PATHS: Partial<Record<DrumSampleId, string>> = {
  kick: "/samples/riddim/kick.wav",
  snare: "/samples/riddim/snare.wav",
  hat: "/samples/riddim/hat.wav",
};

const bufferCache = new Map<string, AudioBuffer>();

/** Fetch sample if published; returns null → DrumEngine uses procedural synth. */
export async function loadDrumSampleBuffer(
  ctx: BaseAudioContext,
  sampleId: DrumSampleId
): Promise<AudioBuffer | null> {
  const path = DRUM_SAMPLE_PATHS[sampleId];
  if (!path) return null;

  const cached = bufferCache.get(path);
  if (cached) return cached;

  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(data.slice(0));
    bufferCache.set(path, buffer);
    return buffer;
  } catch {
    return null;
  }
}

export function clearDrumSampleCache(): void {
  bufferCache.clear();
}
