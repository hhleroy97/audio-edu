/** Detune in cents for voice `index` across `count` voices spanning `totalCents`. */
export function voiceDetune(
  index: number,
  count: number,
  totalCents: number
): number {
  if (count <= 1) return 0;
  const t = index / (count - 1);
  return (t - 0.5) * totalCents;
}

/** Stereo pan in −1…1 for voice `index` with `spread` width. */
export function voicePan(index: number, count: number, spread: number): number {
  if (count <= 1) return 0;
  const t = index / (count - 1);
  return (t - 0.5) * 2 * spread;
}

export function voiceLayout(
  voiceCount: number,
  detune: number,
  spread: number
): { index: number; detuneCents: number; pan: number }[] {
  const count = Math.max(1, Math.round(voiceCount));
  return Array.from({ length: count }, (_, index) => ({
    index,
    detuneCents: voiceDetune(index, count, detune),
    pan: voicePan(index, count, spread),
  }));
}
