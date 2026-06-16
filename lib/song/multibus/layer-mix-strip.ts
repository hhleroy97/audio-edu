import type { LayerMixStripConfig } from "./mix-profiles";

export type StripEqUpdate = {
  hpfHz?: number;
  lpfHz?: number;
};

/** Per-layer EQ + optional mono sum before bus fader. */
export class LayerMixStrip {
  readonly input: GainNode;
  readonly output: GainNode;
  private hpf: BiquadFilterNode | null = null;
  private lpf: BiquadFilterNode | null = null;
  private readonly disposables: AudioNode[] = [];

  constructor(
    private readonly ctx: AudioContext | OfflineAudioContext,
    config: LayerMixStripConfig
  ) {
    this.input = ctx.createGain();
    this.input.gain.value = 1;
    let tail: AudioNode = this.input;

    if (config.saturate) {
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 128 - 1) * 2.5;
        curve[i] = Math.tanh(x * 0.85) * 0.92;
      }
      shaper.curve = curve;
      shaper.oversample = "2x";
      tail.connect(shaper);
      tail = shaper;
      this.disposables.push(shaper);
    }

    if (config.hpfHz !== undefined && config.hpfHz > 0) {
      this.hpf = ctx.createBiquadFilter();
      this.hpf.type = "highpass";
      this.hpf.frequency.value = config.hpfHz;
      this.hpf.Q.value = 0.707;
      tail.connect(this.hpf);
      tail = this.hpf;
      this.disposables.push(this.hpf);
    }

    if (config.lpfHz !== undefined && config.lpfHz > 0) {
      this.lpf = ctx.createBiquadFilter();
      this.lpf.type = "lowpass";
      this.lpf.frequency.value = config.lpfHz;
      this.lpf.Q.value = 0.707;
      tail.connect(this.lpf);
      tail = this.lpf;
      this.disposables.push(this.lpf);
    }

    if (config.mono) {
      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(1);
      const left = ctx.createGain();
      const right = ctx.createGain();
      left.gain.value = 0.5;
      right.gain.value = 0.5;
      tail.connect(splitter);
      splitter.connect(left, 0);
      splitter.connect(right, 1);
      left.connect(merger, 0, 0);
      right.connect(merger, 0, 0);
      tail = merger;
      this.disposables.push(splitter, left, right, merger);
    }

    this.output = ctx.createGain();
    this.output.gain.value = 1;
    tail.connect(this.output);
  }

  setEq(update: StripEqUpdate, atTime?: number): void {
    const t = atTime ?? this.ctx.currentTime;
    if (update.hpfHz !== undefined && this.hpf) {
      this.hpf.frequency.setTargetAtTime(update.hpfHz, t, 0.04);
    }
    if (update.lpfHz !== undefined && this.lpf) {
      this.lpf.frequency.setTargetAtTime(update.lpfHz, t, 0.04);
    }
  }

  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
    for (const node of this.disposables) {
      node.disconnect();
    }
    this.disposables.length = 0;
    this.hpf = null;
    this.lpf = null;
  }
}
