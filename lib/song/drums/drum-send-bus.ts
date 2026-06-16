import type { DrumSendFxType } from "@/lib/schemas/song";

/** Short noise-decay IR — snare space without external assets (#133). */
export function createSnareReverbIr(
  ctx: BaseAudioContext,
  durationSec = 0.32
): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * durationSec);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
    }
  }
  return buffer;
}

/** Snare/clap send — short reverb + dub delay (#126, #133). */
export class DrumSendBus {
  readonly input: GainNode;
  private readonly reverbReturn: GainNode;
  private readonly delayReturn: GainNode;
  private readonly ctx: BaseAudioContext;

  constructor(ctx: BaseAudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.input.gain.value = 1;

    const convolver = ctx.createConvolver();
    convolver.buffer = createSnareReverbIr(ctx);

    const reverbHp = ctx.createBiquadFilter();
    reverbHp.type = "highpass";
    reverbHp.frequency.value = 180;

    this.reverbReturn = ctx.createGain();
    this.reverbReturn.gain.value = 0;

    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.187;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;

    const delayHp = ctx.createBiquadFilter();
    delayHp.type = "highpass";
    delayHp.frequency.value = 400;

    this.delayReturn = ctx.createGain();
    this.delayReturn.gain.value = 0;

    this.input.connect(convolver);
    convolver.connect(reverbHp);
    reverbHp.connect(this.reverbReturn);
    this.reverbReturn.connect(destination);

    this.input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(delayHp);
    delayHp.connect(this.delayReturn);
    this.delayReturn.connect(destination);
  }

  setMix(sendFx: DrumSendFxType, atTime = this.ctx.currentTime): void {
    this.reverbReturn.gain.cancelScheduledValues(atTime);
    this.delayReturn.gain.cancelScheduledValues(atTime);
    this.reverbReturn.gain.setValueAtTime(this.reverbReturn.gain.value, atTime);
    this.delayReturn.gain.setValueAtTime(this.delayReturn.gain.value, atTime);
    this.reverbReturn.gain.linearRampToValueAtTime(sendFx.reverbMix, atTime + 0.02);
    this.delayReturn.gain.linearRampToValueAtTime(sendFx.delayMix ?? 0, atTime + 0.02);
  }

  dispose(): void {
    this.input.disconnect();
    this.reverbReturn.disconnect();
    this.delayReturn.disconnect();
  }
}
