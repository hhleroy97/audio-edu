import * as Tone from "tone";
import type { WaveformType } from "./context";

export type ADSRParams = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  pitchAmount: number;
};

export const DEFAULT_ADSR: ADSRParams = {
  attack: 0.05,
  decay: 0.15,
  sustain: 0.4,
  release: 0.3,
  pitchAmount: 12,
};

export type PitchEnvelopeChain = {
  osc: Tone.Oscillator;
  gain: Tone.Gain;
};

export function createPitchOscillatorChain(
  fftAnalyser: Tone.Analyser,
  baseFrequency: number,
  waveform: WaveformType,
  amplitude: number
): PitchEnvelopeChain {
  const gain = new Tone.Gain(amplitude);
  const osc = new Tone.Oscillator({
    frequency: baseFrequency,
    type: waveform,
  });
  osc.connect(gain);
  gain.connect(fftAnalyser);
  return { osc, gain };
}

export function applyPitchEnvelope(
  osc: Tone.Oscillator,
  baseFrequency: number,
  adsr: ADSRParams,
  noteDuration: number,
  when: number = Tone.now()
) {
  const peakFreq = baseFrequency * Math.pow(2, adsr.pitchAmount / 12);
  const sustainFreq =
    baseFrequency + (peakFreq - baseFrequency) * adsr.sustain;

  osc.frequency.cancelScheduledValues(when);
  osc.frequency.setValueAtTime(baseFrequency, when);
  osc.frequency.linearRampToValueAtTime(peakFreq, when + adsr.attack);
  osc.frequency.linearRampToValueAtTime(
    sustainFreq,
    when + adsr.attack + adsr.decay
  );

  const releaseAt = when + noteDuration;
  osc.frequency.setValueAtTime(sustainFreq, releaseAt);
  osc.frequency.linearRampToValueAtTime(
    baseFrequency,
    releaseAt + adsr.release
  );
}

export function sampleEnvelopeCurve(
  adsr: ADSRParams,
  totalDuration = 2,
  points = 200
): { t: number; level: number }[] {
  const { attack, decay, sustain, release, pitchAmount } = adsr;
  const sustainHold = Math.max(0.2, totalDuration - attack - decay - release);
  const samples: { t: number; level: number }[] = [];

  for (let i = 0; i <= points; i++) {
    const t = (i / points) * totalDuration;
    let level = 0;

    if (t < attack) {
      level = attack > 0 ? t / attack : 1;
    } else if (t < attack + decay) {
      const dt = t - attack;
      level = 1 - (1 - sustain) * (decay > 0 ? dt / decay : 1);
    } else if (t < attack + decay + sustainHold) {
      level = sustain;
    } else {
      const rt = t - (attack + decay + sustainHold);
      level = sustain * (1 - (release > 0 ? rt / release : 1));
    }

    samples.push({ t, level: level * pitchAmount });
  }

  return samples;
}

export function disposePitchChain(chain: PitchEnvelopeChain) {
  chain.osc.dispose();
  chain.gain.dispose();
}
