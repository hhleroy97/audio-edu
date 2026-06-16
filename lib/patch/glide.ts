/** Legato pitch glide on frequency changes while the key gate is open. */
export function rampFrequency(
  param: AudioParam,
  targetHz: number,
  atTime: number,
  glideMs: number,
  gateOpen: boolean
): void {
  const hz = Math.max(20, Math.min(20000, targetHz));
  if (gateOpen && glideMs > 0) {
    const dur = Math.max(0.005, glideMs / 1000);
    param.cancelScheduledValues(atTime);
    const current = Math.max(20, param.value);
    param.setValueAtTime(current, atTime);
    param.exponentialRampToValueAtTime(hz, atTime + dur);
    return;
  }
  param.setTargetAtTime(hz, atTime, 0.02);
}

export const GLIDE_RANGE_MS = { min: 0, max: 120, default: 35 } as const;
