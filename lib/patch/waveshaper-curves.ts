export type DistortionType = "hard" | "soft";

const CURVE_SAMPLES = 4096;

function sampleCurve(
  fn: (x: number, drive: number) => number,
  drive: number
): Float32Array {
  const curve = new Float32Array(CURVE_SAMPLES);
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / (CURVE_SAMPLES - 1) - 1;
    curve[i] = fn(x, drive);
  }
  return curve;
}

function hardClip(x: number, drive: number): number {
  const y = x * drive;
  return Math.max(-1, Math.min(1, y));
}

function softClip(x: number, drive: number): number {
  const y = x * drive;
  const denom = Math.tanh(drive);
  return denom > 0 ? Math.tanh(y) / denom : x;
}

export function buildWaveshaperCurve(
  type: DistortionType,
  drive: number
): Float32Array {
  const d = Math.max(1, drive);
  return sampleCurve(type === "hard" ? hardClip : softClip, d);
}
