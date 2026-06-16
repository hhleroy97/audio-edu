/** Synth layer send — longer reverb + dub delay + chorus width (#113). */

export type SynthSendFxType = {
  reverbMix: number;
  delayMix?: number;
  chorusMix?: number;
};

export function createSynthReverbIr(
  ctx: BaseAudioContext,
  durationSec = 0.85
): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * durationSec);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const decay = (1 - t) * (1 - t);
      data[i] = (Math.random() * 2 - 1) * decay * 0.9;
    }
  }
  return buffer;
}

/** Parallel send for body/top layers — reverb, delay, subtle chorus. */
export class SynthSendBus {
  readonly input: GainNode;
  private readonly reverbReturn: GainNode;
  private readonly delayReturn: GainNode;
  private readonly chorusReturn: GainNode;
  private readonly ctx: BaseAudioContext;

  constructor(ctx: BaseAudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.input.gain.value = 1;

    const convolver = ctx.createConvolver();
    convolver.buffer = createSynthReverbIr(ctx);

    const reverbHp = ctx.createBiquadFilter();
    reverbHp.type = "highpass";
    reverbHp.frequency.value = 120;

    const reverbLp = ctx.createBiquadFilter();
    reverbLp.type = "lowpass";
    reverbLp.frequency.value = 9000;

    this.reverbReturn = ctx.createGain();
    this.reverbReturn.gain.value = 0;

    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.375;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;

    const delayHp = ctx.createBiquadFilter();
    delayHp.type = "highpass";
    delayHp.frequency.value = 280;

    this.delayReturn = ctx.createGain();
    this.delayReturn.gain.value = 0;

    const chorusDelay = ctx.createDelay(0.05);
    chorusDelay.delayTime.value = 0.012;

    const chorusLfo = ctx.createOscillator();
    chorusLfo.frequency.value = 0.35;
    const chorusDepth = ctx.createGain();
    chorusDepth.gain.value = 0.004;
    chorusLfo.connect(chorusDepth);
    chorusDepth.connect(chorusDelay.delayTime);
    chorusLfo.start();

    const chorusWet = ctx.createGain();
    chorusWet.gain.value = 0.5;

    this.chorusReturn = ctx.createGain();
    this.chorusReturn.gain.value = 0;

    this.input.connect(convolver);
    convolver.connect(reverbHp);
    reverbHp.connect(reverbLp);
    reverbLp.connect(this.reverbReturn);
    this.reverbReturn.connect(destination);

    this.input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(delayHp);
    delayHp.connect(this.delayReturn);
    this.delayReturn.connect(destination);

    this.input.connect(chorusDelay);
    chorusDelay.connect(chorusWet);
    chorusWet.connect(this.chorusReturn);
    this.chorusReturn.connect(destination);
  }

  setMix(sendFx: SynthSendFxType, atTime = this.ctx.currentTime): void {
    const ramp = (param: AudioParam, value: number) => {
      param.cancelScheduledValues(atTime);
      param.setValueAtTime(param.value, atTime);
      param.linearRampToValueAtTime(value, atTime + 0.04);
    };
    ramp(this.reverbReturn.gain, sendFx.reverbMix);
    ramp(this.delayReturn.gain, sendFx.delayMix ?? 0);
    ramp(this.chorusReturn.gain, sendFx.chorusMix ?? 0);
  }

  dispose(): void {
    this.input.disconnect();
    this.reverbReturn.disconnect();
    this.delayReturn.disconnect();
    this.chorusReturn.disconnect();
  }
}
