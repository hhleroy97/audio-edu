import * as Tone from "tone";
import type { WaveformType } from "./context";

export type OscillatorParams = {
  frequency: number;
  amplitude: number;
  waveform: WaveformType;
};

export const DEFAULT_OSCILLATOR: OscillatorParams = {
  frequency: 220,
  amplitude: 0.5,
  waveform: "sawtooth",
};

export function createOscillatorChain(
  analyser: Tone.Analyser,
  params: OscillatorParams
) {
  const gain = new Tone.Gain(params.amplitude);
  const osc = new Tone.Oscillator({
    frequency: params.frequency,
    type: params.waveform,
  });

  osc.connect(gain);
  gain.connect(analyser);

  return { osc, gain };
}

export function updateOscillator(
  osc: Tone.Oscillator,
  gain: Tone.Gain,
  params: OscillatorParams
) {
  osc.frequency.value = params.frequency;
  osc.type = params.waveform;
  gain.gain.value = params.amplitude;
}
