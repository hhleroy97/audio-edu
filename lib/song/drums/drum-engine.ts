import type { DrumSampleId } from "@/lib/schemas/drums";
import { isDrumSampleId } from "@/lib/schemas/drums";

/** Procedural kick/snare/hat — no external samples (GitHits #108 Web Audio scheduling). */
export class DrumEngine {
  readonly output: GainNode;
  private readonly ctx: AudioContext | OfflineAudioContext;

  constructor(ctx: AudioContext | OfflineAudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.output.gain.value = 0.85;
    this.output.connect(destination);
  }

  scheduleHit(sampleId: string, atTime: number, velocity = 0.8): void {
    if (!isDrumSampleId(sampleId)) return;
    const v = Math.max(0, Math.min(1, velocity));
    switch (sampleId) {
      case "kick":
        this.scheduleKick(atTime, v);
        break;
      case "snare":
        this.scheduleSnare(atTime, v * 0.75);
        break;
      case "hat":
        this.scheduleHat(atTime, v * 0.45);
        break;
    }
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
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.12));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity, atTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, atTime + 0.16);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.output);
    src.start(atTime);
    src.stop(atTime + 0.2);
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
    this.output.disconnect();
  }
}

export type { DrumSampleId };
