import type { WaveformType } from "@/lib/audio";

/** Sample a periodic waveform at phase t (radians, 0–2π). */
export function sampleWaveform(type: WaveformType, phase: number): number {
  const t = phase % (2 * Math.PI);
  switch (type) {
    case "sine":
      return Math.sin(t);
    case "square":
      return Math.sin(t) >= 0 ? 1 : -1;
    case "sawtooth":
      return 2 * (t / (2 * Math.PI) - 0.5);
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(t));
    default:
      return Math.sin(t);
  }
}

export function parseWaveformType(value: unknown): WaveformType {
  if (
    value === "sine" ||
    value === "square" ||
    value === "sawtooth" ||
    value === "triangle"
  ) {
    return value;
  }
  return "sine";
}
