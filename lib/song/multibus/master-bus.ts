import type { MasterMixAdjustType } from "@/lib/schemas/mix";
import type { MixProfileType } from "./mix-profiles";
import {
  inferMixProfile,
  stripConfigForProfile,
  SYNTH_SEND_DEFAULTS,
} from "./mix-profiles";
import { LayerMixStrip } from "./layer-mix-strip";
import { MasterChain } from "./master-chain";
import { SynthSendBus } from "./synth-send-bus";

/** N-layer mix strips → faders → master chain → analyser → destination. */

export type LayerBusSlot = {
  layerId: string;
  mixProfile: MixProfileType;
  strip: LayerMixStrip;
  fader: GainNode;
  /** Sidechain multiplier — 1 = full level, ducked on kick hits. */
  duckGain: GainNode;
  sendGain: GainNode;
};

export type MasterBusOptions = {
  destination?: AudioNode;
  enableMasterChain?: boolean;
};

export class MasterBus {
  readonly masterChain: MasterChain;
  readonly analyser: AnalyserNode;
  readonly synthSend: SynthSendBus;
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

    this.synthSend = new SynthSendBus(ctx, this.preMaster);

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
    const duckGain = this.ctx.createGain();
    duckGain.gain.value = 1;
    const sendDefaults = SYNTH_SEND_DEFAULTS[profile];
    const sendGain = this.ctx.createGain();
    sendGain.gain.value = sendDefaults.sendLevel;
    strip.output.connect(fader);
    fader.connect(duckGain);
    duckGain.connect(this.preMaster);
    duckGain.connect(sendGain);
    sendGain.connect(this.synthSend.input);

    this.slots.set(layerId, { layerId, mixProfile: profile, strip, fader, duckGain, sendGain });
    return strip.input;
  }

  applyDefaultSynthSends(atTime?: number): void {
    this.synthSend.setMix(
      { reverbMix: 0.22, delayMix: 0.14, chorusMix: 0.06 },
      atTime
    );
  }

  setLayerGain(layerId: string, gain: number, atTime?: number): void {
    const slot = this.slots.get(layerId);
    if (!slot) return;
    const t = atTime ?? this.ctx.currentTime;
    slot.fader.gain.setTargetAtTime(Math.max(0, Math.min(1, gain)), t, 0.04);
  }

  /** Drum bus lands on pre-master (same chain as layer faders). */
  getDrumDestination(): AudioNode {
    return this.preMaster;
  }

  /** Kick-triggered duck — modulates duckGain only, not song layerGain fader. */
  scheduleSidechainDuck(
    layerId: string,
    atTime: number,
    depth: number,
    attackSec: number,
    releaseSec: number
  ): void {
    const slot = this.slots.get(layerId);
    if (!slot) return;
    const g = slot.duckGain.gain;
    g.cancelScheduledValues(atTime);
    g.setValueAtTime(1, atTime);
    g.linearRampToValueAtTime(Math.max(0, 1 - depth), atTime + attackSec);
    g.linearRampToValueAtTime(1, atTime + attackSec + releaseSec);
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
      slot.duckGain.disconnect();
      slot.sendGain.disconnect();
    }
    this.slots.clear();
    this.synthSend.dispose();
    this.preMaster.disconnect();
    this.masterChain.dispose();
    this.analyser.disconnect();
  }
}
