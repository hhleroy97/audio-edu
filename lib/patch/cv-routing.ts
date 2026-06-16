/** DC offset scale when modOffset ∈ [-1, 1] is applied to AudioParams. */
export const CV_OFFSET_SCALE = 1000;

let unipolarCurve: Float32Array | null = null;

/** Rectify LFO to 0…1 for legacy unipolar modulation. */
export function getUnipolarCurve(): Float32Array {
  if (unipolarCurve) return unipolarCurve;
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = Math.max(0, x);
  }
  unipolarCurve = curve;
  return curve;
}

export function scaledModOffset(offset: number): number {
  return offset * CV_OFFSET_SCALE;
}
