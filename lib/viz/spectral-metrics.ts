/** Spectral centroid (Hz) and RMS loudness from byte frequency data. */
export function spectralCentroidHz(
  freqData: Uint8Array,
  sampleRate: number,
  fftSize: number
): number {
  const binHz = sampleRate / fftSize;
  let weighted = 0;
  let total = 0;
  for (let i = 0; i < freqData.length; i++) {
    const mag = freqData[i] / 255;
    weighted += mag * i * binHz;
    total += mag;
  }
  return total > 0 ? weighted / total : 0;
}

export function rmsFromTimeDomain(timeData: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < timeData.length; i++) {
    const v = (timeData[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / timeData.length);
}
