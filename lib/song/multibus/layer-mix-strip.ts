import type { LayerMixStripConfig } from "./mix-profiles";

/** Per-layer EQ + optional mono sum before bus fader. */
export class LayerMixStrip {
  readonly input: GainNode;
  readonly output: GainNode;
  private readonly disposables: AudioNode[] = [];

  constructor(
    private readonly ctx: AudioContext | OfflineAudioContext,
    config: LayerMixStripConfig
  ) {
    this.input = ctx.createGain();
    this.input.gain.value = 1;
    let tail: AudioNode = this.input;

    if (config.hpfHz !== undefined && config.hpfHz > 0) {
      const hpf = ctx.createBiquadFilter();
      hpf.type = "highpass";
      hpf.frequency.value = config.hpfHz;
      hpf.Q.value = 0.707;
      tail.connect(hpf);
      tail = hpf;
      this.disposables.push(hpf);
    }

    if (config.lpfHz !== undefined && config.lpfHz > 0) {
      const lpf = ctx.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = config.lpfHz;
      lpf.Q.value = 0.707;
      tail.connect(lpf);
      tail = lpf;
      this.disposables.push(lpf);
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

  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
    for (const node of this.disposables) {
      node.disconnect();
    }
    this.disposables.length = 0;
  }
}
