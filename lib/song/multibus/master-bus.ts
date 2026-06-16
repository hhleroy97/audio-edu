import type { MasterMixAdjustType } from "@/lib/schemas/mix";
import type { MixProfileType } from "./mix-profiles";
import {
  inferMixProfile,
  stripConfigForProfile,
} from "./mix-profiles";
import { LayerMixStrip } from "./layer-mix-strip";
import { MasterChain } from "./master-chain";

/** N-layer mix strips → faders → master chain → analyser → destination. */

export type LayerBusSlot = {
  layerId: string;
  mixProfile: MixProfileType;
  strip: LayerMixStrip;
  fader: GainNode;
};

export type MasterBusOptions = {
  destination?: AudioNode;
  enableMasterChain?: boolean;
};

export class MasterBus {
  readonly masterChain: MasterChain;
  readonly analyser: AnalyserNode;
  private readonly slots = new Map<string, LayerBusSlot>();
  private readonly preMaster: GainNode;

  constructor(
    readonly ctx: AudioContext | OfflineAudioContext,
    options: MasterBusOptions = {}
  ) {
    const destination = options.destination ?? ctx.destination;
    const useChain = options.enableMasterChain !== false;

    this.masterChain = new MasterChain(ctx);
    this.preMaster = ctx.createGain();
    this.preMaster.gain.value = 1;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    if (useChain) {
      this.preMaster.connect(this.masterChain.input);
      this.masterChain.output.connect(this.analyser);
    } else {
      this.preMaster.connect(this.analyser);
    }
    this.analyser.connect(destination);
  }

  /** @deprecated Use getStripInput — kept for tests expecting getBusInput name. */
  getBusInput(layerId: string): GainNode | undefined {
    return this.getStripInput(layerId);
  }

  /** Connect a layer engine to this slot's mix strip input. */
  getStripInput(layerId: string): GainNode | undefined {
    return this.slots.get(layerId)?.strip.input;
  }

  addLayer(
    layerId: string,
    busGain = 0.75,
    mixProfile?: MixProfileType
  ): GainNode {
    const profile = mixProfile ?? inferMixProfile(layerId);
    const stripConfig = stripConfigForProfile(profile);
    const strip = new LayerMixStrip(this.ctx, stripConfig);
    const fader = this.ctx.createGain();
    fader.gain.value = busGain;
    strip.output.connect(fader);
    fader.connect(this.preMaster);

    this.slots.set(layerId, { layerId, mixProfile: profile, strip, fader });
    return strip.input;
  }

  setLayerGain(layerId: string, gain: number, atTime?: number): void {
    const slot = this.slots.get(layerId);
    if (!slot) return;
    const t = atTime ?? this.ctx.currentTime;
    slot.fader.gain.setTargetAtTime(Math.max(0, Math.min(1, gain)), t, 0.04);
  }

  setMasterGain(gain: number, atTime?: number): void {
    const t = atTime ?? this.ctx.currentTime;
    this.preMaster.gain.setTargetAtTime(Math.max(0, Math.min(1, gain)), t, 0.04);
  }

  getLayerIds(): string[] {
    return [...this.slots.keys()];
  }

  getMixProfile(layerId: string): MixProfileType | undefined {
    return this.slots.get(layerId)?.mixProfile;
  }

  setLayerStripEq(
    layerId: string,
    eq: { hpfHz?: number; lpfHz?: number },
    atTime?: number
  ): void {
    this.slots.get(layerId)?.strip.setEq(eq, atTime);
  }

  setMasterChainParams(params: MasterMixAdjustType, atTime?: number): void {
    this.masterChain.setParams(
      {
        inputGain: params.inputGain,
        glueThreshold: params.glueThreshold,
        limiterThreshold: params.limiterThreshold,
      },
      atTime
    );
  }

  dispose(): void {
    for (const slot of this.slots.values()) {
      slot.strip.dispose();
      slot.fader.disconnect();
    }
    this.slots.clear();
    this.preMaster.disconnect();
    this.masterChain.dispose();
    this.analyser.disconnect();
  }
}
