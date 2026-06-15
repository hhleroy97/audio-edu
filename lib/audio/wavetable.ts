import * as Tone from "tone";
import type { WaveformType } from "./context";

export type WavetableParams = {
  frequency: number;
  amplitude: number;
  position: number;
  waveformA: WaveformType;
  waveformB: WaveformType;
};

export const DEFAULT_WAVETABLE: WavetableParams = {
  frequency: 110,
  amplitude: 0.4,
  position: 0,
  waveformA: "sine",
  waveformB: "sawtooth",
};

export type WavetableChain = {
  oscA: Tone.Oscillator;
  oscB: Tone.Oscillator;
  gainA: Tone.Gain;
  gainB: Tone.Gain;
  masterGain: Tone.Gain;
};

export function createWavetableChain(
  fftAnalyser: Tone.Analyser,
  params: WavetableParams
): WavetableChain {
  const masterGain = new Tone.Gain(params.amplitude);
  const oscA = new Tone.Oscillator({
    frequency: params.frequency,
    type: params.waveformA,
  });
  const oscB = new Tone.Oscillator({
    frequency: params.frequency,
    type: params.waveformB,
  });
  const gainA = new Tone.Gain(1 - params.position);
  const gainB = new Tone.Gain(params.position);

  oscA.connect(gainA);
  oscB.connect(gainB);
  gainA.connect(masterGain);
  gainB.connect(masterGain);
  masterGain.connect(fftAnalyser);

  return { oscA, oscB, gainA, gainB, masterGain };
}

export function updateWavetableChain(
  chain: WavetableChain,
  params: WavetableParams
) {
  chain.oscA.frequency.value = params.frequency;
  chain.oscB.frequency.value = params.frequency;
  chain.oscA.type = params.waveformA;
  chain.oscB.type = params.waveformB;
  chain.gainA.gain.value = 1 - params.position;
  chain.gainB.gain.value = params.position;
  chain.masterGain.gain.value = params.amplitude;
}

export function startWavetable(chain: WavetableChain) {
  chain.oscA.start();
  chain.oscB.start();
}

export function stopWavetable(chain: WavetableChain) {
  chain.oscA.stop();
  chain.oscB.stop();
}

export function disposeWavetable(chain: WavetableChain) {
  chain.oscA.dispose();
  chain.oscB.dispose();
  chain.gainA.dispose();
  chain.gainB.dispose();
  chain.masterGain.dispose();
}
