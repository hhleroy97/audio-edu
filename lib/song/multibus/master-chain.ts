/** dB → linear gain (0 dB = 1). */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export type MasterChainConfig = {
  inputGain?: number;
  glueThreshold?: number;
  glueRatio?: number;
  glueAttack?: number;
  glueRelease?: number;
  limiterThreshold?: number;
  outputGainDb?: number;
};

export const DEFAULT_MASTER_CHAIN: MasterChainConfig = {
  inputGain: 0.88,
  glueThreshold: -20,
  glueRatio: 3,
  glueAttack: 0.012,
  glueRelease: 0.18,
  limiterThreshold: -2,
  outputGainDb: -0.5,
};

/** Glue compressor + fast limiter for song master bus. */
export class MasterChain {
  readonly input: GainNode;
  readonly output: GainNode;
  readonly glue: DynamicsCompressorNode;
  readonly limiter: DynamicsCompressorNode;
  private readonly disposables: AudioNode[] = [];

  constructor(
    ctx: AudioContext | OfflineAudioContext,
    config: MasterChainConfig = DEFAULT_MASTER_CHAIN
  ) {
    this.input = ctx.createGain();
    this.input.gain.value = config.inputGain ?? DEFAULT_MASTER_CHAIN.inputGain!;

    this.glue = ctx.createDynamicsCompressor();
    this.glue.threshold.value =
      config.glueThreshold ?? DEFAULT_MASTER_CHAIN.glueThreshold!;
    this.glue.ratio.value = config.glueRatio ?? DEFAULT_MASTER_CHAIN.glueRatio!;
    this.glue.attack.value =
      config.glueAttack ?? DEFAULT_MASTER_CHAIN.glueAttack!;
    this.glue.release.value =
      config.glueRelease ?? DEFAULT_MASTER_CHAIN.glueRelease!;
    this.glue.knee.value = 8;

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value =
      config.limiterThreshold ?? DEFAULT_MASTER_CHAIN.limiterThreshold!;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.06;
    this.limiter.knee.value = 0;

    this.output = ctx.createGain();
    this.output.gain.value = dbToLinear(
      config.outputGainDb ?? DEFAULT_MASTER_CHAIN.outputGainDb!
    );

    this.input.connect(this.glue);
    this.glue.connect(this.limiter);
    this.limiter.connect(this.output);
    this.disposables.push(this.glue, this.limiter);
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
