export type AmplitudeADSR = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export const DEFAULT_AMPLITUDE_ADSR: AmplitudeADSR = {
  attack: 0.02,
  decay: 0.12,
  sustain: 0.65,
  release: 0.25,
};

/** Sample a 0–1 amplitude ADSR contour for display. */
export function sampleAmplitudeEnvelope(
  adsr: AmplitudeADSR,
  totalDuration = 1.6,
  points = 128
): { t: number; level: number }[] {
  const { attack, decay, sustain, release } = adsr;
  const sustainHold = Math.max(
    0.2,
    totalDuration - attack - decay - release
  );
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

    samples.push({ t, level: Math.max(0, level) });
  }

  return samples;
}

export function scheduleAmplitudeAttack(
  param: AudioParam,
  adsr: AmplitudeADSR,
  peakLevel: number,
  atTime: number
): void {
  const peak = Math.max(0, peakLevel);
  const sus = Math.max(0, adsr.sustain * peak);
  param.cancelScheduledValues(atTime);
  param.setValueAtTime(0, atTime);
  param.linearRampToValueAtTime(peak, atTime + adsr.attack);
  param.linearRampToValueAtTime(sus, atTime + adsr.attack + adsr.decay);
}

export function scheduleAmplitudeRelease(
  param: AudioParam,
  adsr: AmplitudeADSR,
  peakLevel: number,
  atTime: number
): void {
  const sus = Math.max(0, adsr.sustain * peakLevel);
  param.cancelScheduledValues(atTime);
  param.setValueAtTime(sus, atTime);
  param.linearRampToValueAtTime(0, atTime + adsr.release);
}
