import type { SongDefType } from "@/lib/schemas/song";
import { beatToSeconds, songDurationSec } from "./timeline";

export type SongManifestSection = {
  id: string;
  label: string;
  startSec: number;
  endSec: number;
};

export type SongManifest = {
  songId: string;
  title: string;
  bpm: number;
  key: string;
  bars: number;
  durationSec: number;
  sampleRate: number;
  presetIds: string[];
  sections: SongManifestSection[];
  inputsHash: string;
  renderedAt: string;
  gate: "auto" | "human-review";
  version: number;
};

/** Stable djb2 hash for reproducibility metadata. */
export function hashSongInputs(song: SongDefType): string {
  const payload = JSON.stringify({
    schemaVersion: song.schemaVersion,
    meta: song.meta,
    layers: song.layers,
    patches: song.patches,
    sections: song.sections,
  });
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function collectPresetIds(song: SongDefType): string[] {
  const ids = new Set<string>();
  for (const p of song.patches) ids.add(p.presetId);
  for (const section of song.sections) {
    for (const p of section.patches ?? []) ids.add(p.presetId);
    for (const ev of section.events) {
      if (ev.kind === "preset") ids.add(ev.presetId);
    }
  }
  return [...ids].sort();
}

export function buildSongManifest(
  song: SongDefType,
  sampleRate = 48000
): SongManifest {
  const durationSec = songDurationSec(song);
  const sections: SongManifestSection[] = song.sections.map((section) => {
    const startSec = beatToSeconds(
      section.startBar * song.meta.beatsPerBar,
      song.meta.bpm
    );
    const endSec = beatToSeconds(
      section.endBar * song.meta.beatsPerBar,
      song.meta.bpm
    );
    return {
      id: section.id,
      label: section.label,
      startSec,
      endSec,
    };
  });

  return {
    songId: song.meta.id,
    title: song.meta.title,
    bpm: song.meta.bpm,
    key: song.meta.key,
    bars: song.meta.bars,
    durationSec,
    sampleRate,
    presetIds: collectPresetIds(song),
    sections,
    inputsHash: hashSongInputs(song),
    renderedAt: new Date(0).toISOString(),
    gate: song.meta.gate,
    version: song.meta.version,
  };
}

export type OfflineRenderResult = {
  manifest: SongManifest;
  buffer: AudioBuffer | null;
  wavBytes: Uint8Array | null;
};

/** Encode mono/stereo AudioBuffer to 16-bit PCM WAV bytes. */
export function encodeWavPcm16(
  buffer: AudioBuffer,
  sampleRate = buffer.sampleRate
): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length * numChannels;
  const pcm = new Int16Array(length);

  for (let ch = 0; ch < numChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, data[i] ?? 0));
      pcm[i * numChannels + ch] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }

  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcm.byteLength;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const out = new Uint8Array(44 + dataSize);
  out.set(new Uint8Array(header), 0);
  out.set(new Uint8Array(pcm.buffer), 44);
  return out;
}

export type RenderOfflineOptions = {
  sampleRate?: number;
  /** Cap render length for smoke tests (default: full song). */
  maxDurationSec?: number;
};

/**
 * Offline bounce — MVP renders a deterministic silence+click reference buffer
 * when full Patch Lab graph freeze is unavailable (Node / headless).
 * Manifest always reflects the validated song inputs.
 */
export async function renderSongOffline(
  song: SongDefType,
  options: RenderOfflineOptions = {}
): Promise<OfflineRenderResult> {
  const sampleRate = options.sampleRate ?? 48000;
  const fullDuration = songDurationSec(song);
  const durationSec = Math.min(
    fullDuration,
    options.maxDurationSec ?? fullDuration
  );

  const manifest: SongManifest = {
    ...buildSongManifest(song, sampleRate),
    renderedAt: new Date().toISOString(),
    durationSec,
  };

  const OfflineCtx =
    typeof globalThis.OfflineAudioContext !== "undefined"
      ? globalThis.OfflineAudioContext
      : null;

  if (!OfflineCtx) {
    return { manifest, buffer: null, wavBytes: null };
  }

  const frames = Math.ceil(durationSec * sampleRate);
  const ctx = new OfflineCtx(frames, 1, sampleRate);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  osc.frequency.value = 55;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(durationSec);

  const buffer = await ctx.startRendering();
  const wavBytes = encodeWavPcm16(buffer, sampleRate);

  return { manifest, buffer, wavBytes };
}

/** Serialize manifest for `song-manifest.json` export. */
export function manifestToJson(manifest: SongManifest): string {
  return JSON.stringify(manifest, null, 2);
}
