import type { NodeKind } from "./ports";
import { voiceDetune, voicePan } from "@/lib/audio/unison-voice";
import {
  scheduleAmplitudeAttack,
  scheduleAmplitudeRelease,
  type AmplitudeADSR,
} from "@/lib/audio/adsr-amplitude";

export type SourceTone = {
  waveform: OscillatorType;
  frequency: number;
};

export interface RuntimeNode {
  id: string;
  kind: NodeKind;
  /** Primary output for audio routing */
  getOutput(handle: string): AudioNode | null;
  /** Audio input node for a given handle */
  getInput(handle: string): AudioNode | null;
  /** Modulation target (AudioParam) for cv handles */
  getParam(handle: string): AudioParam | null;
  /** Tap point for analysers */
  getTap(): AudioNode | null;
  setParams(params: Record<string, number | string | boolean>, atTime: number): void;
  /** Detune effect: mirror an upstream oscillator's pitch and timbre */
  syncSource?: (source: SourceTone | null) => void;
  setKeyGate?: (open: boolean, atTime: number) => void;
  /** Amplitude envelope: attack on press, release on lift */
  triggerGate?: (open: boolean, atTime: number) => void;
  start(atTime: number): void;
  stop(atTime: number): void;
  dispose(): void;
}

export function scheduleParam(
  param: AudioParam,
  value: number,
  ctx: AudioContext,
  ramp = 0.02
): void {
  const t = ctx.currentTime;
  param.setTargetAtTime(value, t, ramp);
}

export function createOscillatorRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const keyGate = ctx.createGain();
  const level = ctx.createGain();
  keyGate.gain.value = 0;
  level.gain.value = Number(params.gain ?? 1);

  let osc = ctx.createOscillator();
  let started = false;

  const applyOscParams = (
    p: Record<string, number | string | boolean> = params,
    atTime = ctx.currentTime
  ) => {
    osc.type = (p.waveform as OscillatorType) ?? osc.type;
    if (p.frequency !== undefined) {
      osc.frequency.setTargetAtTime(Number(p.frequency), atTime, 0.02);
    }
    if (p.detune !== undefined) {
      osc.detune.setTargetAtTime(Number(p.detune), atTime, 0.02);
    }
  };

  const wireOsc = () => {
    osc.connect(keyGate);
  };

  keyGate.connect(level);

  const rebuildOsc = (atTime: number) => {
    try {
      osc.disconnect();
      if (started) osc.stop(atTime);
    } catch {
      /* noop */
    }
    started = false;
    osc = ctx.createOscillator();
    applyOscParams(params, atTime);
    wireOsc();
  };

  applyOscParams(params, ctx.currentTime);
  wireOsc();

  return {
    id,
    kind: "oscillator",
    getOutput: (handle) => (handle === "audio-out" ? level : null),
    getInput: () => null,
    getParam: (handle) => {
      if (handle === "cv-freq") return osc.frequency;
      if (handle === "cv-detune") return osc.detune;
      return null;
    },
    getTap: () => level,
    setParams: (p, atTime) => {
      if (p.waveform !== undefined) osc.type = p.waveform as OscillatorType;
      if (p.frequency !== undefined) {
        osc.frequency.setTargetAtTime(Number(p.frequency), atTime, 0.02);
      }
      if (p.detune !== undefined) {
        osc.detune.setTargetAtTime(Number(p.detune), atTime, 0.02);
      }
      if (p.gain !== undefined) {
        level.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
    },
    setKeyGate: (open, atTime) => {
      keyGate.gain.setTargetAtTime(open ? 1 : 0, atTime, 0.01);
    },
    start: (atTime) => {
      if (started) return;
      try {
        osc.start(atTime);
        started = true;
      } catch {
        rebuildOsc(atTime);
        osc.start(atTime);
        started = true;
      }
    },
    stop: (atTime) => {
      if (!started) return;
      try {
        osc.stop(atTime);
      } catch {
        /* already stopped */
      }
      started = false;
      rebuildOsc(atTime + 0.06);
    },
    dispose: () => {
      try {
        if (started) osc.stop();
      } catch {
        /* noop */
      }
      started = false;
      osc.disconnect();
      keyGate.disconnect();
      level.disconnect();
    },
  };
}

export function createOutputRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const gain = ctx.createGain();
  gain.gain.value = Number(params.gain ?? 0.8);

  return {
    id,
    kind: "output",
    getOutput: () => null,
    getInput: (handle) => (handle === "audio-in" ? gain : null),
    getParam: () => null,
    getTap: () => gain,
    setParams: (p, atTime) => {
      if (p.gain !== undefined) {
        gain.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
    },
    start: () => {},
    stop: () => {},
    dispose: () => gain.disconnect(),
  };
}

export function createAnalyserRuntime(
  ctx: AudioContext,
  id: string
): RuntimeNode & { analyser: AnalyserNode } {
  const input = ctx.createGain();
  const passthrough = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;
  input.connect(passthrough);
  input.connect(analyser);

  return {
    id,
    kind: "analyser",
    analyser,
    getOutput: (handle) => (handle === "audio-out" ? passthrough : null),
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: () => null,
    getTap: () => analyser,
    setParams: () => {},
    start: () => {},
    stop: () => {},
    dispose: () => {
      input.disconnect();
      passthrough.disconnect();
      analyser.disconnect();
    },
  };
}

type UnisonVoiceRuntime = {
  osc: OscillatorNode;
  panner: StereoPannerNode;
  voiceGain: GainNode;
};

function createDetuneRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const input = ctx.createGain();
  const wetKeyGate = ctx.createGain();
  const level = ctx.createGain();
  wetKeyGate.connect(level);

  let voiceCount = Math.max(1, Math.round(Number(params.voices ?? 3)));
  let voices: UnisonVoiceRuntime[] = [];
  let sourceTone: SourceTone | null = null;

  const readParams = (
    p: Record<string, number | string | boolean> = params
  ) => ({
    detune: Number(p.detune ?? 15),
    spread: Number(p.spread ?? 0.5),
    gain: Number(p.gain ?? 1),
    voices: Math.max(1, Math.round(Number(p.voices ?? voiceCount))),
    waveform: (sourceTone?.waveform ?? "sawtooth") as OscillatorType,
    frequency: sourceTone?.frequency ?? 220,
  });

  const disposeVoices = () => {
    for (const voice of voices) {
      try {
        voice.osc.stop();
      } catch {
        /* noop */
      }
      voice.osc.disconnect();
      voice.panner.disconnect();
      voice.voiceGain.disconnect();
    }
    voices = [];
  };

  const buildVoices = (atTime: number, running: boolean) => {
    disposeVoices();
    const cfg = readParams();
    voiceCount = cfg.voices;
    const perVoice = 1 / voiceCount;

    for (let i = 0; i < voiceCount; i++) {
      const osc = ctx.createOscillator();
      const panner = ctx.createStereoPanner();
      const voiceGain = ctx.createGain();
      osc.type = cfg.waveform;
      osc.frequency.setValueAtTime(cfg.frequency, atTime);
      osc.detune.setValueAtTime(voiceDetune(i, voiceCount, cfg.detune), atTime);
      panner.pan.setValueAtTime(voicePan(i, voiceCount, cfg.spread), atTime);
      voiceGain.gain.setValueAtTime(perVoice, atTime);
      osc.connect(panner);
      panner.connect(voiceGain);
      voiceGain.connect(wetKeyGate);
      if (running) osc.start(atTime);
      voices.push({ osc, panner, voiceGain });
    }
  };

  const applyVoiceParams = (
    atTime: number,
    cfg: ReturnType<typeof readParams>
  ) => {
    const perVoice = 1 / cfg.voices;
    voices.forEach((voice, i) => {
      voice.osc.type = cfg.waveform;
      voice.osc.frequency.setTargetAtTime(cfg.frequency, atTime, 0.02);
      voice.osc.detune.setTargetAtTime(
        voiceDetune(i, cfg.voices, cfg.detune),
        atTime,
        0.02
      );
      voice.panner.pan.setTargetAtTime(
        voicePan(i, cfg.voices, cfg.spread),
        atTime,
        0.02
      );
      voice.voiceGain.gain.setTargetAtTime(perVoice, atTime, 0.02);
    });
    level.gain.setTargetAtTime(cfg.gain, atTime, 0.02);
  };

  wetKeyGate.gain.value = 0;
  level.gain.value = readParams().gain;
  buildVoices(ctx.currentTime, false);

  let isRunning = false;

  return {
    id,
    kind: "detune",
    getOutput: (handle) => (handle === "audio-out" ? level : null),
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: () => null,
    getTap: () => level,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      const cfg = readParams();
      if (p.voices !== undefined && cfg.voices !== voices.length) {
        buildVoices(atTime, isRunning);
        return;
      }
      applyVoiceParams(atTime, cfg);
    },
    syncSource: (source) => {
      sourceTone = source;
      if (!source) {
        wetKeyGate.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
        return;
      }
      applyVoiceParams(ctx.currentTime, readParams());
    },
    setKeyGate: (open, atTime) => {
      if (!sourceTone) {
        wetKeyGate.gain.setTargetAtTime(0, atTime, 0.01);
        return;
      }
      wetKeyGate.gain.setTargetAtTime(open ? 1 : 0, atTime, 0.01);
    },
    start: (atTime) => {
      if (!sourceTone) return;
      isRunning = true;
      for (const voice of voices) {
        try {
          voice.osc.start(atTime);
        } catch {
          /* already running after rebuild */
        }
      }
    },
    stop: (atTime) => {
      isRunning = false;
      for (const voice of voices) {
        try {
          voice.osc.stop(atTime);
        } catch {
          /* noop */
        }
      }
      buildVoices(atTime + 0.06, false);
    },
    dispose: () => {
      disposeVoices();
      input.disconnect();
      wetKeyGate.disconnect();
      level.disconnect();
    },
  };
}

function createEnvelopeRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const input = ctx.createGain();
  const envGain = ctx.createGain();
  const level = ctx.createGain();
  input.connect(envGain);
  envGain.connect(level);
  envGain.gain.value = 0;
  level.gain.value = Number(params.gain ?? 1);

  const readAdsr = (
    p: Record<string, number | string | boolean> = params
  ): AmplitudeADSR & { gain: number } => ({
    attack: Number(p.attack ?? 0.02),
    decay: Number(p.decay ?? 0.12),
    sustain: Number(p.sustain ?? 0.65),
    release: Number(p.release ?? 0.25),
    gain: Number(p.gain ?? 1),
  });

  return {
    id,
    kind: "envelope",
    getOutput: (handle) => (handle === "audio-out" ? level : null),
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: () => null,
    getTap: () => level,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      const cfg = readAdsr();
      level.gain.setTargetAtTime(cfg.gain, atTime, 0.02);
    },
    triggerGate: (open, atTime) => {
      const cfg = readAdsr();
      if (open) {
        scheduleAmplitudeAttack(envGain.gain, cfg, cfg.gain, atTime);
      } else {
        scheduleAmplitudeRelease(envGain.gain, cfg, cfg.gain, atTime);
      }
    },
    start: () => {},
    stop: () => {
      envGain.gain.cancelScheduledValues(ctx.currentTime);
      envGain.gain.setValueAtTime(0, ctx.currentTime);
    },
    dispose: () => {
      input.disconnect();
      envGain.disconnect();
      level.disconnect();
    },
  };
}

export function createRuntimeNode(
  ctx: AudioContext,
  kind: NodeKind,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode | null {
  switch (kind) {
    case "oscillator":
      return createOscillatorRuntime(ctx, id, params);
    case "output":
      return createOutputRuntime(ctx, id, params);
    case "analyser":
      return createAnalyserRuntime(ctx, id);
    case "unison":
    case "detune":
      return createDetuneRuntime(ctx, id, params);
    case "envelope":
      return createEnvelopeRuntime(ctx, id, params);
    default:
      return null;
  }
}
