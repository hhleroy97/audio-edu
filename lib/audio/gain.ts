import * as Tone from "tone";

export function createGain(amount = 0.5) {
  return new Tone.Gain(amount);
}

export function setGainLevel(gain: Tone.Gain, amount: number) {
  gain.gain.value = amount;
}
