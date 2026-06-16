/** Normalized LFO control points: x and y in [0, 1]. */
export type LfoCurvePoint = { x: number; y: number };

/** Riddim stutter — plateau then drop (Serum-style square wobble). */
export const DEFAULT_LFO_CURVE = "0:1,0.4:1,0.5:0,0.9:0,1:1";

export const LFO_SHAPE_OPTIONS = [
  { id: "sine", label: "Sine" },
  { id: "triangle", label: "Tri" },
  { id: "square", label: "Sqr" },
  { id: "sawtooth", label: "Saw" },
  { id: "sampleHold", label: "S&H" },
  { id: "custom", label: "Draw" },
] as const;

export function parseCurvePoints(encoded: string): LfoCurvePoint[] {
  const points = encoded
    .split(",")
    .map((pair) => {
      const [xs, ys] = pair.trim().split(":");
      const x = Number(xs);
      const y = Number(ys);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      };
    })
    .filter((p): p is LfoCurvePoint => p !== null)
    .sort((a, b) => a.x - b.x);

  if (points.length < 2) {
    return [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];
  }
  return points;
}

export function encodeCurvePoints(points: LfoCurvePoint[]): string {
  return points
    .map((p) => `${p.x.toFixed(3)}:${p.y.toFixed(3)}`)
    .join(",");
}

/** Sample piecewise-linear curve at phase t ∈ [0, 1). */
export function sampleCurveAt(points: LfoCurvePoint[], t: number): number {
  const phase = ((t % 1) + 1) % 1;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (phase >= a.x && phase <= b.x) {
      const span = b.x - a.x || 1;
      const u = (phase - a.x) / span;
      return a.y + (b.y - a.y) * u;
    }
  }
  return points[points.length - 1]?.y ?? 0;
}

/** Sample-and-hold: quantize phase to N steps, hold last Y. */
export function sampleHoldAt(steps: number, t: number, seed = 0.37): number {
  const phase = ((t % 1) + 1) % 1;
  const n = Math.max(2, Math.floor(steps));
  const step = Math.floor(phase * n);
  const pseudo = Math.sin((step + 1) * (seed + 1) * 12.9898) * 43758.5453;
  return pseudo - Math.floor(pseudo);
}

const HARMONICS = 64;

/** Build a PeriodicWave from drawable curve (bipolar -1..1 mapped from y 0..1). */
export function buildPeriodicWave(
  ctx: AudioContext,
  points: LfoCurvePoint[]
): PeriodicWave {
  const real = new Float32Array(HARMONICS + 1);
  const imag = new Float32Array(HARMONICS + 1);
  const samples = 256;

  for (let n = 1; n <= HARMONICS; n++) {
    let re = 0;
    let im = 0;
    for (let k = 0; k < samples; k++) {
      const t = k / samples;
      const y = sampleCurveAt(points, t) * 2 - 1;
      const angle = (2 * Math.PI * n * k) / samples;
      re += y * Math.cos(angle);
      im += y * Math.sin(angle);
    }
    real[n] = re / samples;
    imag[n] = im / samples;
  }

  return ctx.createPeriodicWave(real, imag);
}

/** Build S&H periodic wave with `steps` holds per cycle. */
export function buildSampleHoldWave(
  ctx: AudioContext,
  steps = 8
): PeriodicWave {
  const real = new Float32Array(HARMONICS + 1);
  const imag = new Float32Array(HARMONICS + 1);
  const samples = 256;

  for (let n = 1; n <= HARMONICS; n++) {
    let re = 0;
    let im = 0;
    for (let k = 0; k < samples; k++) {
      const t = k / samples;
      const y = sampleHoldAt(steps, t) * 2 - 1;
      const angle = (2 * Math.PI * n * k) / samples;
      re += y * Math.cos(angle);
      im += y * Math.sin(angle);
    }
    real[n] = re / samples;
    imag[n] = im / samples;
  }

  return ctx.createPeriodicWave(real, imag);
}
