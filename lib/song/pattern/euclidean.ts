/** Bjorklund / Euclidean rhythm — step indices with `pulses` hits across `steps`. */
export function euclideanRhythm(pulses: number, steps: number, rotate = 0): number[] {
  if (steps <= 0 || pulses <= 0) return [];
  const p = Math.min(pulses, steps);
  const pattern = new Array<number>(steps).fill(0);
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += p;
    if (bucket >= steps) {
      bucket -= steps;
      pattern[i] = 1;
    }
  }
  const hits: number[] = [];
  for (let i = 0; i < steps; i++) {
    if (pattern[i]) hits.push(i);
  }
  if (rotate === 0) return hits;
  return hits.map((i) => (i + rotate) % steps).sort((a, b) => a - b);
}

/** Map euclidean hits to absolute beats across bars. */
export function euclideanBeatHits(
  pulses: number,
  steps: number,
  bars: number,
  beatsPerBar: number,
  startBeat = 0,
  rotate = 0
): number[] {
  const hits: number[] = [];
  const totalSteps = bars * beatsPerBar;
  const rhythm = euclideanRhythm(pulses, steps, rotate);
  for (let step = 0; step < totalSteps; step++) {
    if (rhythm.includes(step % steps)) {
      hits.push(startBeat + step);
    }
  }
  return hits;
}
