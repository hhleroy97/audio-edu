import type { SidechainDefType } from "@/lib/schemas/drums";
import type { DrumSendFxType, SongDefType, SongLayerDefType } from "@/lib/schemas/song";
import { DrumEngine, SidechainDucker } from "../drums";
import { applyMixDefaultsToLayer } from "./mix-profiles";
import { MasterBus } from "./master-bus";
import { LayerEngine } from "./layer-engine";

export type SongLayerEngineOptions = {
  ctx?: AudioContext | OfflineAudioContext;
  destination?: AudioNode;
  enableMasterChain?: boolean;
};

/** Orchestrates parallel layer engines into one master bus. */
export class SongLayerEngine {
  readonly ctx: AudioContext | OfflineAudioContext;
  readonly masterBus: MasterBus;
  readonly drumEngine: DrumEngine;
  readonly sidechain: SidechainDucker;
  private readonly layers = new Map<string, LayerEngine>();

  constructor(options: SongLayerEngineOptions = {}) {
    this.ctx =
      options.ctx ??
      new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    this.masterBus = new MasterBus(this.ctx, {
      destination: options.destination,
      enableMasterChain: options.enableMasterChain,
    });
    this.drumEngine = new DrumEngine(this.ctx, this.masterBus.getDrumDestination());
    this.sidechain = new SidechainDucker(this.masterBus);
  }

  getLayer(layerId: string): LayerEngine | undefined {
    return this.layers.get(layerId);
  }

  getLayerIds(): string[] {
    return [...this.layers.keys()];
  }

  get analyser(): AnalyserNode {
    return this.masterBus.analyser;
  }

  /** Load layer defs — each preset graph is built once, never hot-swapped mid-song. */
  loadLayers(layerDefs: SongLayerDefType[]): void {
    this.disposeLayers();
    for (const raw of layerDefs) {
      const def = applyMixDefaultsToLayer(raw);
      const stripInput = this.masterBus.addLayer(
        def.id,
        def.busGain,
        def.mixProfile
      );
      const layer = new LayerEngine(this.ctx, def.id, stripInput);
      if (!layer.loadPreset(def.presetId, def.songGain)) {
        throw new Error(`unknown preset for layer ${def.id}: ${def.presetId}`);
      }
      this.layers.set(def.id, layer);
    }
    this.masterBus.applyDefaultSynthSends();
  }

  loadFromSong(song: SongDefType): void {
    const defs =
      song.layers.length > 0
        ? song.layers
        : song.patches.map((p) => ({
            id: p.layer,
            presetId: p.presetId,
            busGain: 0.75,
            defaultMidi: p.defaultMidi,
          }));
    this.loadLayers(defs);
    this.configureSidechain(song.drums?.sidechain ?? null);
  }

  configureSidechain(config: SidechainDefType | null): void {
    this.sidechain.setConfig(config);
  }

  setDrumSendFx(sendFx: DrumSendFxType, atTime?: number): void {
    this.drumEngine.setSendFx(sendFx, atTime);
  }

  /** Schedule procedural drum + optional kick sidechain duck. */
  playDrumHit(sampleId: string, atTime: number, velocity = 0.8): void {
    this.drumEngine.scheduleHit(sampleId, atTime, velocity);
    if (sampleId === "kick") {
      this.sidechain.triggerKick(atTime);
    }
  }

  setTransportBpm(bpm: number): void {
    for (const layer of this.layers.values()) {
      layer.setTransportBpm(bpm);
    }
  }

  setLayerGain(layerId: string, gain: number, atTime?: number): void {
    this.masterBus.setLayerGain(layerId, gain, atTime);
  }

  async startAll(): Promise<void> {
    if ("resume" in this.ctx && typeof this.ctx.resume === "function") {
      await this.ctx.resume();
    }
    for (const layer of this.layers.values()) {
      await layer.start();
    }
  }

  stopAll(): void {
    for (const layer of this.layers.values()) {
      layer.stop();
    }
  }

  disposeLayers(): void {
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();
  }

  dispose(): void {
    this.stopAll();
    this.disposeLayers();
    this.drumEngine.dispose();
    this.masterBus.dispose();
  }
}
