import type { DrumSampleId } from "@/lib/schemas/drums";

/** Optional WAV paths under /public — procedural fallback when missing (phase 98). */
export const DRUM_SAMPLE_PATHS: Partial<Record<DrumSampleId, string>> = {
  kick: "/samples/riddim/kick.wav",
  snare: "/samples/riddim/snare.wav",
  clap: "/samples/riddim/clap.wav",
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

/** Preload all registered riddim samples into DrumEngine when available. */
export async function loadAllDrumSamples(
  ctx: BaseAudioContext,
  engine: { setSampleBuffer: (id: DrumSampleId, buffer: AudioBuffer) => void }
): Promise<number> {
  let loaded = 0;
  for (const id of ["kick", "snare", "clap", "hat"] as DrumSampleId[]) {
    const buffer = await loadDrumSampleBuffer(ctx, id);
    if (buffer) {
      engine.setSampleBuffer(id, buffer);
      loaded++;
    }
  }
  return loaded;
}
