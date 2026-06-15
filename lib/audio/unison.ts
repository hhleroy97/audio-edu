import * as Tone from "tone";
import type { WaveformType } from "./context";

export type UnisonParams = {
  frequency: number;
  amplitude: number;
  waveform: WaveformType;
  voiceCount: number;
  detune: number;
  spread: number;
};

export const DEFAULT_UNISON: UnisonParams = {
  frequency: 220,
  amplitude: 0.4,
  waveform: "sawtooth",
  voiceCount: 3,
  detune: 15,
  spread: 0.8,
};

export type UnisonVoice = {
  osc: Tone.Oscillator;
  panner: Tone.Panner;
};

export type UnisonChain = {
  voices: UnisonVoice[];
  masterGain: Tone.Gain;
};

function voiceDetune(index: number, count: number, totalCents: number): number {
  if (count <= 1) return 0;
  const t = index / (count - 1);
  return (t - 0.5) * totalCents;
}

function voicePan(index: number, count: number, spread: number): number {
  if (count <= 1) return 0;
  const t = index / (count - 1);
  return (t - 0.5) * 2 * spread;
}

export function createUnisonChain(
  fftAnalyser: Tone.Analyser,
  waveformAnalyser: Tone.Analyser | null,
  params: UnisonParams
): UnisonChain {
  const masterGain = new Tone.Gain(params.amplitude);
  const voices: UnisonVoice[] = [];

  for (let i = 0; i < params.voiceCount; i++) {
    const osc = new Tone.Oscillator({
      frequency: params.frequency,
      type: params.waveform,
    });
    osc.detune.value = voiceDetune(i, params.voiceCount, params.detune);

    const panner = new Tone.Panner(voicePan(i, params.voiceCount, params.spread));
    osc.connect(panner);
    panner.connect(masterGain);
    voices.push({ osc, panner });
  }

  masterGain.connect(fftAnalyser);
  if (waveformAnalyser) {
    masterGain.connect(waveformAnalyser);
  }

  return { voices, masterGain };
}

export function updateUnisonChain(chain: UnisonChain, params: UnisonParams) {
  chain.masterGain.gain.value = params.amplitude;

  while (chain.voices.length < params.voiceCount) {
    const i = chain.voices.length;
    const osc = new Tone.Oscillator({
      frequency: params.frequency,
      type: params.waveform,
    });
    const panner = new Tone.Panner(0);
    osc.connect(panner);
    panner.connect(chain.masterGain);
    chain.voices.push({ osc, panner });
  }

  while (chain.voices.length > params.voiceCount) {
    const removed = chain.voices.pop();
    removed?.osc.dispose();
    removed?.panner.dispose();
  }

  chain.voices.forEach((voice, i) => {
    voice.osc.frequency.value = params.frequency;
    voice.osc.type = params.waveform;
    voice.osc.detune.value = voiceDetune(i, params.voiceCount, params.detune);
    voice.panner.pan.value = voicePan(i, params.voiceCount, params.spread);
  });
}

export function startUnison(chain: UnisonChain) {
  chain.voices.forEach((v) => v.osc.start());
}

export function stopUnison(chain: UnisonChain) {
  chain.voices.forEach((v) => v.osc.stop());
}

export function disposeUnison(chain: UnisonChain) {
  chain.voices.forEach((v) => {
    v.osc.dispose();
    v.panner.dispose();
  });
  chain.masterGain.dispose();
}
