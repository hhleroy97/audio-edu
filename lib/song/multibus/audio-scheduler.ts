import type { SongDefType } from "@/lib/schemas/song";
import { songTotalBeats } from "../timeline";
import {
  compileMultibusSchedule,
  scheduleEndTime,
  type CompiledAction,
} from "./compile-schedule";
import { prepareMultibusEngine } from "./prepare-engine";
import type { SongLayerEngine } from "./song-layer-engine";

export type MultibusSchedulerProgress = {
  beat: number;
  totalBeats: number;
  action: CompiledAction;
};

export type MultibusAudioSchedulerOptions = {
  engine: SongLayerEngine;
  onProgress?: (progress: MultibusSchedulerProgress) => void;
  onComplete?: () => void;
};

function clearGateTimers(timers: Map<string, ReturnType<typeof setTimeout>>): void {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}

export function dispatchMultibusAction(
  engine: SongLayerEngine,
  action: CompiledAction,
  gateTimers: Map<string, ReturnType<typeof setTimeout>>
): void {
  switch (action.type) {
    case "note": {
      const layer = engine.getLayer(action.layerId);
      if (!layer) return;
      layer.scheduleNote(action.midi, action.atTime, action.durationSec);
      break;
    }
    case "layerGain":
      engine.setLayerGain(action.layerId, action.gain, action.atTime);
      break;
    case "layerPreset": {
      const layer = engine.getLayer(action.layerId);
      if (!layer) return;
      layer.loadPreset(action.presetId);
      void layer.start();
      break;
    }
    case "drumHit":
      engine.playDrumHit(action.sampleId, action.atTime, action.velocity);
      break;
    case "drumSendFx":
      engine.setDrumSendFx(
        { reverbMix: action.reverbMix, delayMix: action.delayMix },
        action.atTime
      );
      break;
    case "gate": {
      if (!action.layerId || action.layerId === "drums") return;
      const layer = engine.getLayer(action.layerId);
      if (!layer) return;
      layer.setGate(action.open, action.atTime);
      if (action.open && action.durationSec !== undefined) {
        const key = action.layerId;
        const prev = gateTimers.get(key);
        if (prev) clearTimeout(prev);
        const delayMs = Math.max(0, (action.atTime + action.durationSec - engine.ctx.currentTime) * 1000);
        gateTimers.set(
          key,
          setTimeout(() => {
            layer.setGate(false);
            gateTimers.delete(key);
          }, delayMs)
        );
      }
      break;
    }
    case "automation": {
      if (!action.nodeId) return;
      const layer = engine.getLayer(action.layerId);
      if (!layer) return;
      layer.setNodeParamsAt(
        action.nodeId,
        { [action.param]: action.value },
        action.atTime
      );
      break;
    }
    default:
      break;
  }
}

/** Audio-context scheduler — dispatches compiled actions on rAF vs `currentTime`. */
export class MultibusAudioScheduler {
  private rafId = 0;
  private actions: CompiledAction[] = [];
  private index = 0;
  private epoch = 0;
  private endTime = 0;
  private playing = false;
  private totalBeats = 32;
  private readonly gateTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly options: MultibusAudioSchedulerOptions) {}

  get isPlaying(): boolean {
    return this.playing;
  }

  async play(song: SongDefType): Promise<void> {
    this.stop();
    const { engine, onProgress, onComplete } = this.options;

    await prepareMultibusEngine(engine, song);
    await engine.startAll();

    this.epoch = engine.ctx.currentTime + 0.08;
    this.actions = compileMultibusSchedule(song, this.epoch, song.meta.bpm);
    this.endTime = scheduleEndTime(song, this.epoch, song.meta.bpm);
    this.totalBeats = songTotalBeats(song);
    this.index = 0;
    this.playing = true;

    const tick = () => {
      if (!this.playing) return;
      const now = engine.ctx.currentTime;
      while (
        this.index < this.actions.length &&
        this.actions[this.index]!.atTime <= now + 0.003
      ) {
        const action = this.actions[this.index]!;
        dispatchMultibusAction(engine, action, this.gateTimers);
        onProgress?.({
          beat: action.absoluteBeat,
          totalBeats: this.totalBeats,
          action,
        });
        this.index++;
      }
      if (now >= this.endTime + 0.05) {
        this.stop();
        onComplete?.();
        return;
      }
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    this.playing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    clearGateTimers(this.gateTimers);
    this.options.engine.stopAll();
    this.index = 0;
  }
}
