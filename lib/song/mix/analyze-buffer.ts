/** RMS, peak, and spectral centroid from an AudioBuffer (offline mix analysis). */

export type BufferMetrics = {
  rms: number;
  peak: number;
  centroidHz: number;
};

function rmsAndPeak(data: Float32Array): { rms: number; peak: number } {
  if (data.length === 0) return { rms: 0, peak: 0 };
  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    const s = data[i]!;
    sumSq += s * s;
    peak = Math.max(peak, Math.abs(s));
  }
  return { rms: Math.sqrt(sumSq / data.length), peak };
}

/** Windowed DFT centroid — sufficient for mix-pass band overlap rules. */
export function estimateSpectralCentroidHz(
  data: Float32Array,
  sampleRate: number,
  fftSize = 2048
): number {
  if (data.length < fftSize || sampleRate <= 0) return 0;

  const windows = Math.min(8, Math.floor(data.length / fftSize));
  const step =
    windows > 1
      ? Math.floor((data.length - fftSize) / (windows - 1))
      : 0;

  let weighted = 0;
  let total = 0;

  for (let w = 0; w < windows; w++) {
    const offset = w * step;
    for (let k = 1; k < fftSize / 2; k++) {
      let re = 0;
      let im = 0;
      for (let n = 0; n < fftSize; n++) {
        const ang = (2 * Math.PI * k * n) / fftSize;
        const sample = data[offset + n] ?? 0;
        re += sample * Math.cos(ang);
        im -= sample * Math.sin(ang);
      }
      const mag = Math.sqrt(re * re + im * im);
      const hz = (k * sampleRate) / fftSize;
      weighted += mag * hz;
      total += mag;
    }
  }

  return total > 0 ? weighted / total : 0;
}

export function analyzeAudioBuffer(buffer: AudioBuffer): BufferMetrics {
  const ch0 = buffer.getChannelData(0);
  const { rms, peak } = rmsAndPeak(ch0);

  let centroidHz = estimateSpectralCentroidHz(ch0, buffer.sampleRate);
  if (buffer.numberOfChannels > 1) {
    const ch1 = buffer.getChannelData(1);
    centroidHz =
      (centroidHz +
        estimateSpectralCentroidHz(ch1, buffer.sampleRate)) /
      2;
  }

  return { rms, peak, centroidHz };
}
