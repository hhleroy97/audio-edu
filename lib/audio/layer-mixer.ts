import * as Tone from "tone";
import type { WaveformType } from "./context";

export type SynthLayer = {
  id: string;
  enabled: boolean;
  frequency: number;
  waveform: WaveformType;
  gain: number;
  cutoff: number;
};

export const DEFAULT_LAYERS: SynthLayer[] = [
  {
    id: "layer-a",
    enabled: true,
    frequency: 55,
    waveform: "sawtooth",
    gain: 0.35,
    cutoff: 400,
  },
  {
    id: "layer-b",
    enabled: true,
    frequency: 110,
    waveform: "square",
    gain: 0.25,
    cutoff: 1200,
  },
  {
    id: "layer-c",
    enabled: false,
    frequency: 220,
    waveform: "triangle",
    gain: 0.2,
    cutoff: 2000,
  },
];

type ActiveLayer = {
  osc: Tone.Oscillator;
  filter: Tone.Filter;
  gain: Tone.Gain;
  layerId: string;
};

export type LayerMixerChain = {
  masterGain: Tone.Gain;
  layers: ActiveLayer[];
};

export function createLayerMixerChain(
  fftAnalyser: Tone.Analyser,
  layers: SynthLayer[]
): LayerMixerChain {
  const masterGain = new Tone.Gain(0.8);
  const active: ActiveLayer[] = [];

  for (const layer of layers) {
    if (!layer.enabled) continue;
    const osc = new Tone.Oscillator({
      frequency: layer.frequency,
      type: layer.waveform,
    });
    const filter = new Tone.Filter({
      frequency: layer.cutoff,
      type: "lowpass",
      Q: 4,
    });
    const gain = new Tone.Gain(layer.gain);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    active.push({ osc, filter, gain, layerId: layer.id });
  }

  masterGain.connect(fftAnalyser);
  return { masterGain, layers: active };
}

export function updateLayerMixerChain(
  chain: LayerMixerChain,
  fftAnalyser: Tone.Analyser,
  layers: SynthLayer[]
): LayerMixerChain {
  disposeLayerMixerChain(chain);
  return createLayerMixerChain(fftAnalyser, layers);
}

export function startLayerMixer(chain: LayerMixerChain) {
  chain.layers.forEach((l) => l.osc.start());
}

export function stopLayerMixer(chain: LayerMixerChain) {
  chain.layers.forEach((l) => l.osc.stop());
}

export function disposeLayerMixerChain(chain: LayerMixerChain) {
  chain.layers.forEach((l) => {
    l.osc.dispose();
    l.filter.dispose();
    l.gain.dispose();
  });
  chain.masterGain.dispose();
}
