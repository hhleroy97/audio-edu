import type { NodeKind } from "./ports";
import { voiceDetune, voicePan } from "@/lib/audio/unison-voice";
import {
  scheduleAmplitudeAttack,
  scheduleAmplitudeRelease,
  type AmplitudeADSR,
} from "@/lib/audio/adsr-amplitude";
import { resolveLfoRateHz } from "./transport";
import {
  buildWaveshaperCurve,
  type DistortionType,
} from "./waveshaper-curves";
import {
  buildPeriodicWave,
  buildSampleHoldWave,
  DEFAULT_LFO_CURVE,
  parseCurvePoints,
} from "./lfo-curve";
import { getFormantVowel } from "./formant-presets";
import { createNoiseBuffer } from "@/lib/audio/noise-buffer";
import { rampFrequency } from "./glide";

const resampleBuffers = new Map<string, AudioBuffer>();

export function registerRuntimeResampleBuffer(
  id: string,
  buffer: AudioBuffer
): void {
  resampleBuffers.set(id, buffer);
}

export function getRuntimeResampleBuffer(id: string): AudioBuffer | undefined {
  return resampleBuffers.get(id);
}

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
  let gateOpen = false;

  const applyOscParams = (
    p: Record<string, number | string | boolean> = params,
    atTime = ctx.currentTime
  ) => {
    osc.type = (p.waveform as OscillatorType) ?? osc.type;
    if (p.frequency !== undefined) {
      rampFrequency(
        osc.frequency,
        Number(p.frequency),
        atTime,
        Number(p.glideMs ?? params.glideMs ?? 0),
        gateOpen
      );
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
        rampFrequency(
          osc.frequency,
          Number(p.frequency),
          atTime,
          Number(p.glideMs ?? params.glideMs ?? 0),
          gateOpen
        );
      }
      if (p.detune !== undefined) {
        osc.detune.setTargetAtTime(Number(p.detune), atTime, 0.02);
      }
      if (p.gain !== undefined) {
        level.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
      if (p.glideMs !== undefined) Object.assign(params, { glideMs: p.glideMs });
    },
    setKeyGate: (open, atTime) => {
      gateOpen = open;
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
    getTap: () => passthrough,
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

  const cvConstant = ctx.createConstantSource();
  const cvEnvGain = ctx.createGain();
  const cvSignGain = ctx.createGain();
  cvConstant.offset.value = 1;
  cvEnvGain.gain.value = 0;
  const cvSign = Number(params.cvSign ?? 1) >= 0 ? 1 : -1;
  cvSignGain.gain.value = cvSign;
  cvConstant.connect(cvEnvGain);
  cvEnvGain.connect(cvSignGain);
  let cvStarted = false;

  const readAdsr = (
    p: Record<string, number | string | boolean> = params
  ): AmplitudeADSR & { gain: number; cvDepth: number } => ({
    attack: Number(p.attack ?? 0.02),
    decay: Number(p.decay ?? 0.12),
    sustain: Number(p.sustain ?? 0.65),
    release: Number(p.release ?? 0.25),
    gain: Number(p.gain ?? 1),
    cvDepth: Number(p.cvDepth ?? 400),
  });

  const scheduleEnvelope = (open: boolean, atTime: number) => {
    const cfg = readAdsr();
    if (open) {
      scheduleAmplitudeAttack(envGain.gain, cfg, cfg.gain, atTime);
      scheduleAmplitudeAttack(cvEnvGain.gain, cfg, cfg.cvDepth, atTime);
    } else {
      scheduleAmplitudeRelease(envGain.gain, cfg, cfg.gain, atTime);
      scheduleAmplitudeRelease(cvEnvGain.gain, cfg, cfg.cvDepth, atTime);
    }
  };

  return {
    id,
    kind: "envelope",
    getOutput: (handle) => {
      if (handle === "audio-out") return level;
      if (handle === "cv-out") return cvSignGain;
      return null;
    },
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: () => null,
    getTap: () => level,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      const cfg = readAdsr();
      level.gain.setTargetAtTime(cfg.gain, atTime, 0.02);
      if (p.cvSign !== undefined) {
        const sign = Number(p.cvSign) >= 0 ? 1 : -1;
        cvSignGain.gain.setTargetAtTime(sign, atTime, 0.02);
      }
    },
    triggerGate: (open, atTime) => {
      if (!cvStarted) {
        cvConstant.start(atTime);
        cvStarted = true;
      }
      scheduleEnvelope(open, atTime);
    },
    start: (atTime) => {
      if (!cvStarted) {
        cvConstant.start(atTime);
        cvStarted = true;
      }
    },
    stop: () => {
      envGain.gain.cancelScheduledValues(ctx.currentTime);
      envGain.gain.setValueAtTime(0, ctx.currentTime);
      cvEnvGain.gain.cancelScheduledValues(ctx.currentTime);
      cvEnvGain.gain.setValueAtTime(0, ctx.currentTime);
      try {
        cvConstant.stop();
      } catch {
        /* noop */
      }
      cvStarted = false;
    },
    dispose: () => {
      input.disconnect();
      envGain.disconnect();
      level.disconnect();
      cvConstant.disconnect();
      cvEnvGain.disconnect();
      cvSignGain.disconnect();
    },
  };
}

function parseLfoShape(shape: string | number | boolean | undefined): OscillatorType {
  const s = String(shape ?? "sine");
  if (s === "triangle" || s === "square" || s === "sawtooth") return s;
  return "sine";
}

function applyLfoShape(
  osc: OscillatorNode,
  ctx: AudioContext,
  params: Record<string, number | string | boolean>
): void {
  const shape = String(params.shape ?? "sine");
  if (shape === "custom") {
    const points = parseCurvePoints(
      String(params.curvePoints ?? DEFAULT_LFO_CURVE)
    );
    osc.setPeriodicWave(buildPeriodicWave(ctx, points));
    return;
  }
  if (shape === "sampleHold") {
    const steps = Number(params.holdSteps ?? 8);
    osc.setPeriodicWave(buildSampleHoldWave(ctx, steps));
    return;
  }
  osc.type = parseLfoShape(shape);
}

function createLfoRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const osc = ctx.createOscillator();
  const depthGain = ctx.createGain();
  applyLfoShape(osc, ctx, params);
  const initialHz = resolveLfoRateHz(params, Number(params.transportBpm ?? 140));
  osc.frequency.value = initialHz;
  depthGain.gain.value = Number(params.depth ?? 1);
  osc.connect(depthGain);

  let started = false;

  return {
    id,
    kind: "lfo",
    getOutput: (handle) => (handle === "cv-out" ? depthGain : null),
    getInput: () => null,
    getParam: () => null,
    getTap: () => depthGain,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      if (p.shape !== undefined || p.curvePoints !== undefined) {
        applyLfoShape(osc, ctx, params);
      }
      if (
        p.rate !== undefined ||
        p.sync !== undefined ||
        p.transportBpm !== undefined ||
        p.rateRatio !== undefined ||
        p.keyTrack !== undefined ||
        p.noteHz !== undefined
      ) {
        const hz = resolveLfoRateHz(params, Number(params.transportBpm ?? 140));
        osc.frequency.setTargetAtTime(hz, atTime, 0.02);
      }
      if (p.holdSteps !== undefined && String(params.shape) === "sampleHold") {
        applyLfoShape(osc, ctx, params);
      }
      if (p.depth !== undefined) {
        depthGain.gain.setTargetAtTime(Number(p.depth), atTime, 0.02);
      }
    },
    start: (atTime) => {
      if (started) return;
      try {
        osc.start(atTime);
        started = true;
      } catch {
        /* already running */
      }
    },
    stop: (atTime) => {
      if (!started) return;
      try {
        osc.stop(atTime);
      } catch {
        /* noop */
      }
      started = false;
    },
    dispose: () => {
      try {
        if (started) osc.stop();
      } catch {
        /* noop */
      }
      osc.disconnect();
      depthGain.disconnect();
    },
  };
}

function createFilterRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const input = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const output = ctx.createGain();
  filter.type = "lowpass";
  filter.frequency.value = Number(params.cutoff ?? 1200);
  filter.Q.value = Number(params.resonance ?? 1);
  input.connect(filter);
  filter.connect(output);

  return {
    id,
    kind: "filter",
    getOutput: (handle) => (handle === "audio-out" ? output : null),
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: (handle) => {
      if (handle === "cv-cutoff") return filter.frequency;
      if (handle === "cv-resonance") return filter.Q;
      return null;
    },
    getTap: () => output,
    setParams: (p, atTime) => {
      if (p.cutoff !== undefined) {
        filter.frequency.setTargetAtTime(Number(p.cutoff), atTime, 0.02);
      }
      if (p.resonance !== undefined) {
        filter.Q.setTargetAtTime(Number(p.resonance), atTime, 0.02);
      }
    },
    start: () => {},
    stop: () => {},
    dispose: () => {
      input.disconnect();
      filter.disconnect();
      output.disconnect();
    },
  };
}

function createMacroRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const source = ctx.createConstantSource();
  const depthGain = ctx.createGain();
  const value = Number(params.value ?? 0.5);
  source.offset.value = value * 2 - 1;
  source.connect(depthGain);
  let started = false;

  return {
    id,
    kind: "macro",
    getOutput: (handle) => (handle === "cv-out" ? depthGain : null),
    getInput: () => null,
    getParam: () => null,
    getTap: () => depthGain,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      if (p.value !== undefined) {
        source.offset.setTargetAtTime(Number(p.value) * 2 - 1, atTime, 0.02);
      }
    },
    start: (atTime) => {
      if (started) return;
      try {
        source.start(atTime);
        started = true;
      } catch {
        /* already running */
      }
    },
    stop: () => {},
    dispose: () => {
      try {
        if (started) source.stop();
      } catch {
        /* noop */
      }
      source.disconnect();
      depthGain.disconnect();
    },
  };
}

function createSamplerRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const output = ctx.createGain();
  const keyGate = ctx.createGain();
  keyGate.gain.value = 0;
  output.gain.value = Number(params.gain ?? 0.8);
  keyGate.connect(output);

  let player: AudioBufferSourceNode | null = null;
  let bufferId = String(params.bufferId ?? "");

  const playBuffer = (atTime: number) => {
    const buffer = getRuntimeResampleBuffer(bufferId);
    if (!buffer) return;
    try {
      player?.stop();
    } catch {
      /* noop */
    }
    player = ctx.createBufferSource();
    player.buffer = buffer;
    player.loop = Boolean(params.loop ?? true);
    player.connect(keyGate);
    player.start(atTime);
  };

  return {
    id,
    kind: "sampler",
    getOutput: (handle) => (handle === "audio-out" ? output : null),
    getInput: () => null,
    getParam: () => null,
    getTap: () => output,
    setParams: (p, atTime) => {
      if (p.gain !== undefined) {
        output.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
      if (p.bufferId !== undefined) {
        bufferId = String(p.bufferId);
      }
    },
    setKeyGate: (open, atTime) => {
      keyGate.gain.setTargetAtTime(open ? 1 : 0, atTime, 0.01);
      if (open) playBuffer(atTime);
      else {
        try {
          player?.stop(atTime + 0.05);
        } catch {
          /* noop */
        }
      }
    },
    start: () => {},
    stop: () => {},
    dispose: () => {
      try {
        player?.stop();
      } catch {
        /* noop */
      }
      player?.disconnect();
      keyGate.disconnect();
      output.disconnect();
    },
  };
}

function createMixerRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const inA = ctx.createGain();
  const inB = ctx.createGain();
  const gainA = ctx.createGain();
  const gainB = ctx.createGain();
  const sum = ctx.createGain();
  inA.connect(gainA);
  inB.connect(gainB);
  gainA.connect(sum);
  gainB.connect(sum);
  gainA.gain.value = Number(params.gainA ?? 0.5);
  gainB.gain.value = Number(params.gainB ?? 0.5);
  sum.gain.value = Number(params.gain ?? 0.8);

  return {
    id,
    kind: "mixer",
    getOutput: (handle) => (handle === "audio-out" ? sum : null),
    getInput: (handle) => {
      if (handle === "audio-in-a") return inA;
      if (handle === "audio-in-b") return inB;
      return null;
    },
    getParam: () => null,
    getTap: () => sum,
    setParams: (p, atTime) => {
      if (p.gainA !== undefined) {
        gainA.gain.setTargetAtTime(Number(p.gainA), atTime, 0.02);
      }
      if (p.gainB !== undefined) {
        gainB.gain.setTargetAtTime(Number(p.gainB), atTime, 0.02);
      }
      if (p.gain !== undefined) {
        sum.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
    },
    start: () => {},
    stop: () => {},
    dispose: () => {
      inA.disconnect();
      inB.disconnect();
      gainA.disconnect();
      gainB.disconnect();
      sum.disconnect();
    },
  };
}

function parseWaveformParam(
  value: string | number | boolean | undefined
): OscillatorType {
  const s = String(value ?? "sine");
  if (s === "square" || s === "sawtooth" || s === "triangle") return s;
  return "sine";
}

function createWavetableRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const keyGate = ctx.createGain();
  const level = ctx.createGain();
  keyGate.gain.value = 0;
  level.gain.value = Number(params.gain ?? 0.5);

  let oscA = ctx.createOscillator();
  let oscB = ctx.createOscillator();
  const gainA = ctx.createGain();
  const gainB = ctx.createGain();
  let started = false;
  let gateOpen = false;

  const applyPosition = (position: number, atTime: number) => {
    gainA.gain.setTargetAtTime(1 - position, atTime, 0.02);
    gainB.gain.setTargetAtTime(position, atTime, 0.02);
  };

  const wireOsc = () => {
    oscA.connect(gainA);
    oscB.connect(gainB);
    gainA.connect(keyGate);
    gainB.connect(keyGate);
  };

  keyGate.connect(level);

  const applyParams = (
    p: Record<string, number | string | boolean> = params,
    atTime = ctx.currentTime
  ) => {
    oscA.type = parseWaveformParam(p.waveformA);
    oscB.type = parseWaveformParam(p.waveformB);
    if (p.frequency !== undefined) {
      const freq = Number(p.frequency);
      const glide = Number(p.glideMs ?? params.glideMs ?? 0);
      rampFrequency(oscA.frequency, freq, atTime, glide, gateOpen);
      rampFrequency(oscB.frequency, freq, atTime, glide, gateOpen);
    }
    if (p.position !== undefined) {
      applyPosition(Number(p.position), atTime);
    }
    if (p.gain !== undefined) {
      level.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
    }
  };

  applyParams(params, ctx.currentTime);
  wireOsc();

  return {
    id,
    kind: "wavetable",
    getOutput: (handle) => (handle === "audio-out" ? level : null),
    getInput: () => null,
    getParam: (handle) => (handle === "cv-pos" ? gainB.gain : null),
    getTap: () => level,
    setParams: (p, atTime) => {
      if (p.waveformA !== undefined || p.waveformB !== undefined) {
        applyParams({ ...params, ...p }, atTime);
      } else {
        applyParams(p, atTime);
      }
    },
    setKeyGate: (open, atTime) => {
      gateOpen = open;
      keyGate.gain.setTargetAtTime(open ? 1 : 0, atTime, 0.01);
    },
    start: (atTime) => {
      if (started) return;
      oscA.start(atTime);
      oscB.start(atTime);
      started = true;
    },
    stop: (atTime) => {
      if (!started) return;
      try {
        oscA.stop(atTime + 0.02);
        oscB.stop(atTime + 0.02);
      } catch {
        /* noop */
      }
      started = false;
    },
    dispose: () => {
      try {
        if (started) oscA.stop();
        if (started) oscB.stop();
      } catch {
        /* noop */
      }
      oscA.disconnect();
      oscB.disconnect();
      gainA.disconnect();
      gainB.disconnect();
      keyGate.disconnect();
      level.disconnect();
    },
  };
}

function createFmRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const keyGate = ctx.createGain();
  const level = ctx.createGain();
  keyGate.gain.value = 0;
  level.gain.value = Number(params.gain ?? 0.5);

  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modDepth = ctx.createGain();

  let started = false;
  let gateOpen = false;

  const applyFm = (
    p: Record<string, number | string | boolean> = params,
    atTime = ctx.currentTime
  ) => {
    const freq = Number(p.frequency ?? 110);
    const ratio = Number(p.ratio ?? 1);
    const glide = Number(p.glideMs ?? params.glideMs ?? 0);
    carrier.type = parseWaveformParam(p.carrierWave);
    modulator.type = parseWaveformParam(p.modWave);
    rampFrequency(carrier.frequency, freq, atTime, glide, gateOpen);
    rampFrequency(modulator.frequency, freq * ratio, atTime, glide, gateOpen);
    modDepth.gain.setTargetAtTime(Number(p.index ?? 300), atTime, 0.02);
    if (p.gain !== undefined) {
      level.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
    }
  };

  modulator.connect(modDepth);
  modDepth.connect(carrier.frequency);
  carrier.connect(keyGate);
  keyGate.connect(level);
  applyFm(params, ctx.currentTime);

  return {
    id,
    kind: "fm",
    getOutput: (handle) => (handle === "audio-out" ? level : null),
    getInput: () => null,
    getParam: (handle) => {
      if (handle === "cv-index") return modDepth.gain;
      if (handle === "cv-freq") return carrier.frequency;
      return null;
    },
    getTap: () => level,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      applyFm(p, atTime);
    },
    setKeyGate: (open, atTime) => {
      gateOpen = open;
      keyGate.gain.setTargetAtTime(open ? 1 : 0, atTime, 0.01);
    },
    start: (atTime) => {
      if (started) return;
      carrier.start(atTime);
      modulator.start(atTime);
      started = true;
    },
    stop: (atTime) => {
      if (!started) return;
      try {
        carrier.stop(atTime + 0.02);
        modulator.stop(atTime + 0.02);
      } catch {
        /* noop */
      }
      started = false;
    },
    dispose: () => {
      try {
        if (started) carrier.stop();
        if (started) modulator.stop();
      } catch {
        /* noop */
      }
      carrier.disconnect();
      modulator.disconnect();
      modDepth.disconnect();
      keyGate.disconnect();
      level.disconnect();
    },
  };
}

function createDistortionRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const input = ctx.createGain();
  const driveGain = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  const wet = ctx.createGain();
  const dry = ctx.createGain();
  const output = ctx.createGain();

  input.connect(driveGain);
  driveGain.connect(shaper);
  shaper.connect(wet);
  input.connect(dry);
  wet.connect(output);
  dry.connect(output);

  const applyDistortion = (
    p: Record<string, number | string | boolean> = params
  ) => {
    const type = (String(p.type ?? "hard") === "soft" ? "soft" : "hard") as DistortionType;
    const drive = Number(p.drive ?? 4);
    const mix = Number(p.mix ?? 0.85);
    shaper.curve = new Float32Array(buildWaveshaperCurve(type, drive));
    shaper.oversample = "4x";
    driveGain.gain.value = 1;
    wet.gain.value = mix;
    dry.gain.value = 1 - mix;
    output.gain.value = Number(p.gain ?? 0.75);
  };

  applyDistortion(params);

  return {
    id,
    kind: "distortion",
    getOutput: (handle) => (handle === "audio-out" ? output : null),
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: () => null,
    getTap: () => output,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      applyDistortion(params);
      if (p.gain !== undefined) {
        output.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
    },
    start: () => {},
    stop: () => {},
    dispose: () => {
      input.disconnect();
      driveGain.disconnect();
      shaper.disconnect();
      wet.disconnect();
      dry.disconnect();
      output.disconnect();
    },
  };
}

type LayerChannel = {
  input: GainNode;
  hpf: BiquadFilterNode;
  lpf: BiquadFilterNode;
  gain: GainNode;
};

function createLayerChannel(
  ctx: AudioContext,
  hpfHz: number,
  lpfHz: number,
  level: number,
  mono = false
): LayerChannel {
  const input = ctx.createGain();
  const hpf = ctx.createBiquadFilter();
  const lpf = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  hpf.type = "highpass";
  lpf.type = "lowpass";
  hpf.frequency.value = hpfHz;
  lpf.frequency.value = lpfHz;
  gain.gain.value = level;
  input.connect(hpf);
  hpf.connect(lpf);
  lpf.connect(gain);
  if (mono) {
    gain.channelCount = 1;
    gain.channelCountMode = "explicit";
  }
  return { input, hpf, lpf, gain };
}

function createLayerStackRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const sub = createLayerChannel(
    ctx,
    30,
    Number(params.subLpf ?? 200),
    Number(params.subGain ?? 0.75),
    true
  );
  const body = createLayerChannel(
    ctx,
    Number(params.bodyHpf ?? 80),
    Number(params.bodyLpf ?? 6000),
    Number(params.bodyGain ?? 0.55)
  );
  const top = createLayerChannel(
    ctx,
    Number(params.topHpf ?? 2000),
    Number(params.topLpf ?? 16000),
    Number(params.topGain ?? 0.35)
  );
  const sum = ctx.createGain();
  sum.gain.value = Number(params.gain ?? 0.8);

  sub.gain.connect(sum);
  body.gain.connect(sum);
  top.gain.connect(sum);

  return {
    id,
    kind: "layerStack",
    getOutput: (handle) => (handle === "audio-out" ? sum : null),
    getInput: (handle) => {
      if (handle === "audio-in-sub") return sub.input;
      if (handle === "audio-in-body") return body.input;
      if (handle === "audio-in-top") return top.input;
      return null;
    },
    getParam: () => null,
    getTap: () => sum,
    setParams: (p, atTime) => {
      if (p.subLpf !== undefined) {
        sub.lpf.frequency.setTargetAtTime(Number(p.subLpf), atTime, 0.02);
      }
      if (p.subGain !== undefined) {
        sub.gain.gain.setTargetAtTime(Number(p.subGain), atTime, 0.02);
      }
      if (p.bodyHpf !== undefined) {
        body.hpf.frequency.setTargetAtTime(Number(p.bodyHpf), atTime, 0.02);
      }
      if (p.bodyLpf !== undefined) {
        body.lpf.frequency.setTargetAtTime(Number(p.bodyLpf), atTime, 0.02);
      }
      if (p.bodyGain !== undefined) {
        body.gain.gain.setTargetAtTime(Number(p.bodyGain), atTime, 0.02);
      }
      if (p.topHpf !== undefined) {
        top.hpf.frequency.setTargetAtTime(Number(p.topHpf), atTime, 0.02);
      }
      if (p.topLpf !== undefined) {
        top.lpf.frequency.setTargetAtTime(Number(p.topLpf), atTime, 0.02);
      }
      if (p.topGain !== undefined) {
        top.gain.gain.setTargetAtTime(Number(p.topGain), atTime, 0.02);
      }
      if (p.gain !== undefined) {
        sum.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
    },
    start: () => {},
    stop: () => {},
    dispose: () => {
      sub.input.disconnect();
      sub.hpf.disconnect();
      sub.lpf.disconnect();
      sub.gain.disconnect();
      body.input.disconnect();
      body.hpf.disconnect();
      body.lpf.disconnect();
      body.gain.disconnect();
      top.input.disconnect();
      top.hpf.disconnect();
      top.lpf.disconnect();
      top.gain.disconnect();
      sum.disconnect();
    },
  };
}

function createFormantRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const filters: BiquadFilterNode[] = [];
  const bandGains: GainNode[] = [];
  const bandWeights = [1, 0.75, 0.45];

  for (let i = 0; i < 3; i++) {
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.Q.value = Number(params.q ?? 9);
    const g = ctx.createGain();
    g.gain.value = bandWeights[i];
    input.connect(bpf);
    bpf.connect(g);
    g.connect(output);
    filters.push(bpf);
    bandGains.push(g);
  }

  const applyVowel = (
    p: Record<string, number | string | boolean> = params,
    atTime = ctx.currentTime
  ) => {
    const vowel = getFormantVowel(String(p.vowel ?? "a"));
    const shift = Number(p.formantShift ?? 0);
    filters.forEach((f, i) => {
      const base = vowel.freqs[i];
      const freq = i === 1 ? base + shift * 900 : base;
      f.frequency.setTargetAtTime(freq, atTime, 0.02);
    });
    output.gain.setTargetAtTime(Number(p.gain ?? 0.65), atTime, 0.02);
  };

  applyVowel(params, ctx.currentTime);

  return {
    id,
    kind: "formant",
    getOutput: (handle) => (handle === "audio-out" ? output : null),
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: (handle) => {
      if (handle === "cv-formant") return filters[1].frequency;
      return null;
    },
    getTap: () => output,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      applyVowel(params, atTime);
      if (p.q !== undefined) {
        const q = Number(p.q);
        filters.forEach((f) => f.Q.setTargetAtTime(q, atTime, 0.02));
      }
    },
    start: () => {},
    stop: () => {},
    dispose: () => {
      input.disconnect();
      output.disconnect();
      filters.forEach((f) => f.disconnect());
      bandGains.forEach((g) => g.disconnect());
    },
  };
}

function createNoiseRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const keyGate = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const level = ctx.createGain();
  keyGate.gain.value = 0;
  filter.type = "bandpass";
  filter.frequency.value = Number(params.cutoff ?? 3200);
  filter.Q.value = Number(params.resonance ?? 2.5);
  level.gain.value = Number(params.gain ?? 0.35);
  keyGate.connect(filter);
  filter.connect(level);

  let source: AudioBufferSourceNode | null = null;
  let started = false;

  const startSource = (atTime: number) => {
    if (started) return;
    const noiseType = String(params.noiseType ?? "white") === "pink" ? "pink" : "white";
    const buffer = createNoiseBuffer(ctx, noiseType);
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(keyGate);
    try {
      source.start(atTime);
      started = true;
    } catch {
      /* noop */
    }
  };

  return {
    id,
    kind: "noise",
    getOutput: (handle) => (handle === "audio-out" ? level : null),
    getInput: () => null,
    getParam: (handle) => {
      if (handle === "cv-cutoff") return filter.frequency;
      return null;
    },
    getTap: () => level,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      if (p.cutoff !== undefined) {
        filter.frequency.setTargetAtTime(Number(p.cutoff), atTime, 0.02);
      }
      if (p.resonance !== undefined) {
        filter.Q.setTargetAtTime(Number(p.resonance), atTime, 0.02);
      }
      if (p.gain !== undefined) {
        level.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
    },
    setKeyGate: (open, atTime) => {
      keyGate.gain.cancelScheduledValues(atTime);
      keyGate.gain.setTargetAtTime(open ? 1 : 0, atTime, 0.015);
    },
    start: (atTime) => startSource(atTime),
    stop: (atTime) => {
      if (!started || !source) return;
      try {
        source.stop(atTime);
      } catch {
        /* noop */
      }
      source.disconnect();
      source = null;
      started = false;
    },
    dispose: () => {
      try {
        if (started && source) source.stop();
      } catch {
        /* noop */
      }
      source?.disconnect();
      keyGate.disconnect();
      filter.disconnect();
      level.disconnect();
    },
  };
}

type BandChain = {
  filter: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  gain: GainNode;
};

function createMultibandRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  input.connect(dry);
  dry.connect(output);

  const lowCross = Number(params.lowCross ?? 250);
  const highCross = Number(params.highCross ?? 2500);
  const amount = Number(params.amount ?? 0.65);

  const makeBand = (
    type: BiquadFilterType,
    freq: number,
    q = 0.7
  ): BandChain => {
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = Number(params.threshold ?? -24);
    comp.ratio.value = Number(params.ratio ?? 8);
    comp.attack.value = 0.003;
    comp.release.value = 0.12;
    comp.knee.value = 6;
    const gain = ctx.createGain();
    gain.gain.value = 1;
    input.connect(filter);
    filter.connect(comp);
    comp.connect(gain);
    gain.connect(wet);
    return { filter, comp, gain };
  };

  const low = makeBand("lowpass", lowCross);
  const high = makeBand("highpass", highCross);
  const midHpf = ctx.createBiquadFilter();
  midHpf.type = "highpass";
  midHpf.frequency.value = lowCross;
  const midLpf = ctx.createBiquadFilter();
  midLpf.type = "lowpass";
  midLpf.frequency.value = highCross;
  const midComp = ctx.createDynamicsCompressor();
  midComp.threshold.value = Number(params.threshold ?? -24);
  midComp.ratio.value = Number(params.ratio ?? 8);
  const midGain = ctx.createGain();
  input.connect(midHpf);
  midHpf.connect(midLpf);
  midLpf.connect(midComp);
  midComp.connect(midGain);
  midGain.connect(wet);
  wet.connect(output);

  const applyMix = (atTime: number) => {
    const amt = Number(params.amount ?? 0.65);
    wet.gain.setTargetAtTime(amt, atTime, 0.02);
    dry.gain.setTargetAtTime(1 - amt * 0.35, atTime, 0.02);
    output.gain.setTargetAtTime(Number(params.gain ?? 0.85), atTime, 0.02);
  };
  applyMix(ctx.currentTime);

  return {
    id,
    kind: "multiband",
    getOutput: (handle) => (handle === "audio-out" ? output : null),
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: () => null,
    getTap: () => output,
    setParams: (p, atTime) => {
      Object.assign(params, p);
      if (p.lowCross !== undefined) {
        low.filter.frequency.setTargetAtTime(Number(p.lowCross), atTime, 0.02);
        midHpf.frequency.setTargetAtTime(Number(p.lowCross), atTime, 0.02);
      }
      if (p.highCross !== undefined) {
        high.filter.frequency.setTargetAtTime(Number(p.highCross), atTime, 0.02);
        midLpf.frequency.setTargetAtTime(Number(p.highCross), atTime, 0.02);
      }
      if (p.threshold !== undefined || p.ratio !== undefined) {
        const th = Number(params.threshold ?? -24);
        const ra = Number(params.ratio ?? 8);
        for (const band of [low, high]) {
          band.comp.threshold.setTargetAtTime(th, atTime, 0.02);
          band.comp.ratio.setTargetAtTime(ra, atTime, 0.02);
        }
        midComp.threshold.setTargetAtTime(th, atTime, 0.02);
        midComp.ratio.setTargetAtTime(ra, atTime, 0.02);
      }
      applyMix(atTime);
    },
    start: () => {},
    stop: () => {},
    dispose: () => {
      input.disconnect();
      output.disconnect();
      dry.disconnect();
      wet.disconnect();
      low.filter.disconnect();
      low.comp.disconnect();
      low.gain.disconnect();
      high.filter.disconnect();
      high.comp.disconnect();
      high.gain.disconnect();
      midHpf.disconnect();
      midLpf.disconnect();
      midComp.disconnect();
      midGain.disconnect();
    },
  };
}

function createModFxRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const depthGain = ctx.createGain();
  const modOsc = ctx.createOscillator();
  const modScale = ctx.createGain();

  input.connect(dry);
  dry.connect(output);
  input.connect(wet);
  wet.connect(output);

  const delay = ctx.createDelay(0.05);
  const feedback = ctx.createGain();
  const phaserStages: BiquadFilterNode[] = [];

  for (let i = 0; i < 4; i++) {
    const ap = ctx.createBiquadFilter();
    ap.type = "allpass";
    ap.frequency.value = 600 + i * 180;
    ap.Q.value = 0.9;
    phaserStages.push(ap);
  }

  let fxPath: AudioNode = wet;
  let started = false;

  const wireFx = () => {
    const type = String(params.type ?? "phaser");
    try {
      wet.disconnect();
    } catch {
      /* noop */
    }
    if (type === "comb") {
      delay.delayTime.value = Number(params.delayMs ?? 8) / 1000;
      feedback.gain.value = Number(params.feedback ?? 0.62);
      input.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      fxPath = delay;
    } else if (type === "flanger") {
      delay.delayTime.value = 0.003;
      feedback.gain.value = Number(params.feedback ?? 0.45);
      input.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      modScale.gain.value = 0.0025;
      modOsc.connect(modScale);
      modScale.connect(delay.delayTime);
      fxPath = delay;
    } else {
      let prev: AudioNode = input;
      for (const stage of phaserStages) {
        prev.connect(stage);
        prev = stage;
      }
      prev.connect(wet);
      modScale.gain.value = 500;
      modOsc.connect(modScale);
      modScale.connect(phaserStages[0].frequency);
      fxPath = phaserStages[phaserStages.length - 1];
    }
  };

  wireFx();

  const applyParams = (atTime: number) => {
    const mix = Number(params.mix ?? 0.55);
    const depth = Number(params.depth ?? 0.7);
    wet.gain.setTargetAtTime(mix, atTime, 0.02);
    dry.gain.setTargetAtTime(1 - mix, atTime, 0.02);
    output.gain.setTargetAtTime(Number(params.gain ?? 0.8), atTime, 0.02);
    depthGain.gain.setTargetAtTime(depth, atTime, 0.02);
    modOsc.frequency.setTargetAtTime(Number(params.rate ?? 0.4), atTime, 0.02);
  };
  applyParams(ctx.currentTime);

  return {
    id,
    kind: "modFx",
    getOutput: (handle) => (handle === "audio-out" ? output : null),
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: (handle) => {
      if (handle === "cv-depth") return depthGain.gain;
      return null;
    },
    getTap: () => output,
    setParams: (p, atTime) => {
      const typeChanged = p.type !== undefined && p.type !== params.type;
      Object.assign(params, p);
      if (typeChanged) wireFx();
      applyParams(atTime);
    },
    start: (atTime) => {
      if (started) return;
      modOsc.start(atTime);
      started = true;
    },
    stop: (atTime) => {
      if (!started) return;
      try {
        modOsc.stop(atTime);
      } catch {
        /* noop */
      }
      started = false;
    },
    dispose: () => {
      try {
        if (started) modOsc.stop();
      } catch {
        /* noop */
      }
      input.disconnect();
      output.disconnect();
      dry.disconnect();
      wet.disconnect();
      delay.disconnect();
      feedback.disconnect();
      modOsc.disconnect();
      modScale.disconnect();
      depthGain.disconnect();
      phaserStages.forEach((s) => s.disconnect());
    },
  };
}

function createFilterBankRuntime(
  ctx: AudioContext,
  id: string,
  params: Record<string, number | string | boolean>
): RuntimeNode {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const f1 = ctx.createBiquadFilter();
  const f2 = ctx.createBiquadFilter();
  const mixA = ctx.createGain();
  const mixB = ctx.createGain();

  f1.type = "lowpass";
  f2.type = "lowpass";
  f1.frequency.value = Number(params.f1Cutoff ?? 900);
  f2.frequency.value = Number(params.f2Cutoff ?? 3200);
  f1.Q.value = Number(params.f1Res ?? 4);
  f2.Q.value = Number(params.f2Res ?? 2);
  output.gain.value = Number(params.gain ?? 0.8);

  const route = () => {
    try {
      input.disconnect();
      f1.disconnect();
      f2.disconnect();
      mixA.disconnect();
      mixB.disconnect();
    } catch {
      /* noop */
    }
    const mode = String(params.mode ?? "serial");
    if (mode === "parallel") {
      input.connect(f1);
      input.connect(f2);
      f1.connect(mixA);
      f2.connect(mixB);
      mixA.gain.value = 0.55;
      mixB.gain.value = 0.45;
      mixA.connect(output);
      mixB.connect(output);
    } else {
      input.connect(f1);
      f1.connect(f2);
      f2.connect(output);
    }
  };
  route();

  return {
    id,
    kind: "filterBank",
    getOutput: (handle) => (handle === "audio-out" ? output : null),
    getInput: (handle) => (handle === "audio-in" ? input : null),
    getParam: (handle) => {
      if (handle === "cv-cutoff") return f1.frequency;
      if (handle === "cv-cutoff-b") return f2.frequency;
      return null;
    },
    getTap: () => output,
    setParams: (p, atTime) => {
      const modeChanged = p.mode !== undefined && p.mode !== params.mode;
      Object.assign(params, p);
      if (modeChanged) route();
      if (p.f1Cutoff !== undefined) {
        f1.frequency.setTargetAtTime(Number(p.f1Cutoff), atTime, 0.02);
      }
      if (p.f2Cutoff !== undefined) {
        f2.frequency.setTargetAtTime(Number(p.f2Cutoff), atTime, 0.02);
      }
      if (p.f1Res !== undefined) {
        f1.Q.setTargetAtTime(Number(p.f1Res), atTime, 0.02);
      }
      if (p.f2Res !== undefined) {
        f2.Q.setTargetAtTime(Number(p.f2Res), atTime, 0.02);
      }
      if (p.gain !== undefined) {
        output.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
    },
    start: () => {},
    stop: () => {},
    dispose: () => {
      input.disconnect();
      output.disconnect();
      f1.disconnect();
      f2.disconnect();
      mixA.disconnect();
      mixB.disconnect();
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
    case "lfo":
      return createLfoRuntime(ctx, id, params);
    case "filter":
      return createFilterRuntime(ctx, id, params);
    case "mixer":
      return createMixerRuntime(ctx, id, params);
    case "wavetable":
      return createWavetableRuntime(ctx, id, params);
    case "fm":
      return createFmRuntime(ctx, id, params);
    case "distortion":
      return createDistortionRuntime(ctx, id, params);
    case "layerStack":
      return createLayerStackRuntime(ctx, id, params);
    case "formant":
      return createFormantRuntime(ctx, id, params);
    case "noise":
      return createNoiseRuntime(ctx, id, params);
    case "multiband":
      return createMultibandRuntime(ctx, id, params);
    case "modFx":
      return createModFxRuntime(ctx, id, params);
    case "filterBank":
      return createFilterBankRuntime(ctx, id, params);
    case "macro":
      return createMacroRuntime(ctx, id, params);
    case "sampler":
      return createSamplerRuntime(ctx, id, params);
    default:
      return null;
  }
}
