import * as Tone from "tone";
import type { WaveformType } from "./context";

export type FilterParams = {
  frequency: number;
  amplitude: number;
  waveform: WaveformType;
  cutoff: number;
  resonance: number;
};

export const DEFAULT_FILTER: FilterParams = {
  frequency: 110,
  amplitude: 0.45,
  waveform: "sawtooth",
  cutoff: 800,
  resonance: 8,
};

export type FilterChain = {
  osc: Tone.Oscillator;
  filter: Tone.Filter;
  gain: Tone.Gain;
};

export function createFilterChain(
  fftAnalyser: Tone.Analyser,
  params: FilterParams
): FilterChain {
  const gain = new Tone.Gain(params.amplitude);
  const filter = new Tone.Filter({
    frequency: params.cutoff,
    type: "lowpass",
    Q: params.resonance,
  });
  const osc = new Tone.Oscillator({
    frequency: params.frequency,
    type: params.waveform,
  });

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(fftAnalyser);

  return { osc, filter, gain };
}

export function updateFilterChain(chain: FilterChain, params: FilterParams) {
  chain.osc.frequency.value = params.frequency;
  chain.osc.type = params.waveform;
  chain.filter.frequency.value = params.cutoff;
  chain.filter.Q.value = params.resonance;
  chain.gain.gain.value = params.amplitude;
}

export function sampleLowpassResponse(
  cutoff: number,
  resonance: number,
  sampleRate = 44100,
  points = 256
): { freq: number; db: number }[] {
  const nyquist = sampleRate / 2;
  const q = Math.max(0.1, resonance);
  const samples: { freq: number; db: number }[] = [];

  for (let i = 1; i <= points; i++) {
    const freq = (i / points) * nyquist;
    const w = (2 * Math.PI * freq) / sampleRate;
    const wc = (2 * Math.PI * cutoff) / sampleRate;
    const alpha = Math.sin(wc) / (2 * q);
    const cosW = Math.cos(w);
    const cosWc = Math.cos(wc);

    const b0 = (1 - cosWc) / 2;
    const b1 = 1 - cosWc;
    const b2 = (1 - cosWc) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosWc;
    const a2 = 1 - alpha;

    const re =
      b0 +
      b1 * Math.cos(w) +
      b2 * Math.cos(2 * w);
    const im =
      b1 * Math.sin(w) +
      b2 * Math.sin(2 * w);
    const denRe = a0 + a1 * cosW + a2 * Math.cos(2 * w);
    const denIm = a1 * Math.sin(w) + a2 * Math.sin(2 * w);

    const numMag = Math.sqrt(re * re + im * im);
    const denMag = Math.sqrt(denRe * denRe + denIm * denIm);
    const mag = numMag / Math.max(denMag, 1e-9);
    const db = 20 * Math.log10(Math.max(mag, 1e-6));

    samples.push({ freq, db });
  }

  return samples;
}

export function disposeFilterChain(chain: FilterChain) {
  chain.osc.dispose();
  chain.filter.dispose();
  chain.gain.dispose();
}
