import type { DrumSampleId } from "@/lib/schemas/drums";
import type { DrumSendFxType } from "@/lib/schemas/song";
import { isDrumSampleId } from "@/lib/schemas/drums";
import { DrumSendBus } from "./drum-send-bus";

const SEND_SAMPLE_IDS = new Set<DrumSampleId>(["snare", "clap"]);

/** Procedural kick/snare/hat — optional WAV + snare send FX (#109). */
export class DrumEngine {
  readonly output: GainNode;
  private readonly ctx: AudioContext | OfflineAudioContext;
  private readonly sendBus: DrumSendBus;

  private readonly sampleBuffers: Partial<Record<DrumSampleId, AudioBuffer>> = {};

  constructor(ctx: AudioContext | OfflineAudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.output.gain.value = 0.85;
    this.output.connect(destination);
    this.sendBus = new DrumSendBus(ctx, destination);
  }

  get loadedSampleCount(): number {
    return Object.keys(this.sampleBuffers).length;
  }

  usesSampleBuffer(sampleId: DrumSampleId): boolean {
    return this.sampleBuffers[sampleId] !== undefined;
  }

  scheduleHit(sampleId: string, atTime: number, velocity = 0.8): void {
    if (!isDrumSampleId(sampleId)) return;
    const v = Math.max(0, Math.min(1, velocity));
    const buffer = this.sampleBuffers[sampleId];
    if (buffer) {
      this.scheduleBuffer(buffer, atTime, v, this.output);
      if (SEND_SAMPLE_IDS.has(sampleId)) {
        this.scheduleBuffer(buffer, atTime, v * 0.72, this.sendBus.input);
      }
      return;
    }
    switch (sampleId) {
      case "kick":
        this.scheduleKick(atTime, v);
        break;
      case "snare":
        this.scheduleSnare(atTime, v * 0.75);
        break;
      case "clap":
        this.scheduleClap(atTime, v * 0.7);
        break;
      case "hat":
        this.scheduleHat(atTime, v * 0.45);
        break;
    }
  }

  /** Attach decoded WAV — falls back to procedural when unset. */
  setSampleBuffer(sampleId: DrumSampleId, buffer: AudioBuffer): void {
    this.sampleBuffers[sampleId] = buffer;
  }

  setSendFx(sendFx: DrumSendFxType, atTime?: number): void {
    this.sendBus.setMix(sendFx, atTime ?? this.ctx.currentTime);
  }

  private scheduleBuffer(
    buffer: AudioBuffer,
    atTime: number,
    velocity: number,
    destination: AudioNode
  ): void {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity, atTime);
    src.connect(gain);
    gain.connect(destination);
    src.start(atTime);
  }

  private scheduleSnareToSend(atTime: number, velocity: number): void {
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.12));
    }
    this.scheduleBuffer(buffer, atTime, velocity, this.output);
    this.scheduleBuffer(buffer, atTime, velocity * 0.65, this.sendBus.input);
  }

  private scheduleClapToSend(atTime: number, velocity: number): void {
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 18) * (1 - t);
    }
    this.scheduleBuffer(buffer, atTime, velocity, this.output);
    this.scheduleBuffer(buffer, atTime, velocity * 0.55, this.sendBus.input);
  }

  private scheduleKick(atTime: number, velocity: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, atTime);
    osc.frequency.exponentialRampToValueAtTime(42, atTime + 0.08);
    gain.gain.setValueAtTime(0.0001, atTime);
    gain.gain.exponentialRampToValueAtTime(velocity, atTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, atTime + 0.22);
    osc.connect(gain);
    gain.connect(this.output);
    osc.start(atTime);
    osc.stop(atTime + 0.25);
  }

  private scheduleSnare(atTime: number, velocity: number): void {
    this.scheduleSnareToSend(atTime, velocity);
  }

  private scheduleClap(atTime: number, velocity: number): void {
    this.scheduleClapToSend(atTime, velocity);
  }

  private scheduleHat(atTime: number, velocity: number): void {
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.6, atTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, atTime + 0.035);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(this.output);
    src.start(atTime);
    src.stop(atTime + 0.05);
  }

  dispose(): void {
    this.sendBus.dispose();
    this.output.disconnect();
  }
}

export type { DrumSampleId };
