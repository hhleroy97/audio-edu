import type { NodeKind } from "./ports";

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
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = (params.waveform as OscillatorType) ?? "sine";
  osc.frequency.value = Number(params.frequency ?? 220);
  osc.detune.value = Number(params.detune ?? 0);
  gain.gain.value = Number(params.gain ?? 0.5);
  osc.connect(gain);

  return {
    id,
    kind: "oscillator",
    getOutput: (handle) => (handle === "audio-out" ? gain : null),
    getInput: () => null,
    getParam: (handle) => {
      if (handle === "cv-freq") return osc.frequency;
      if (handle === "cv-detune") return osc.detune;
      return null;
    },
    getTap: () => gain,
    setParams: (p, atTime) => {
      if (p.waveform !== undefined) osc.type = p.waveform as OscillatorType;
      if (p.frequency !== undefined) {
        osc.frequency.setTargetAtTime(Number(p.frequency), atTime, 0.02);
      }
      if (p.detune !== undefined) {
        osc.detune.setTargetAtTime(Number(p.detune), atTime, 0.02);
      }
      if (p.gain !== undefined) {
        gain.gain.setTargetAtTime(Number(p.gain), atTime, 0.02);
      }
    },
    start: (atTime) => osc.start(atTime),
    stop: (atTime) => {
      try {
        osc.stop(atTime);
      } catch {
        /* already stopped */
      }
    },
    dispose: () => {
      try {
        osc.stop();
      } catch {
        /* noop */
      }
      osc.disconnect();
      gain.disconnect();
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
    default:
      return null;
  }
}
