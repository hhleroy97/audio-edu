"use client";

import { ParamSlider } from "./ParamSlider";
import { WaveformSelector } from "./WaveformSelector";
import type { SynthLayer } from "@/lib/audio/layer-mixer";
import type { WaveformType } from "@/lib/audio";

type LayerPanelProps = {
  layers: SynthLayer[];
  onChange: (layers: SynthLayer[]) => void;
};

export function LayerPanel({ layers, onChange }: LayerPanelProps) {
  const updateLayer = (id: string, patch: Partial<SynthLayer>) => {
    onChange(
      layers.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  return (
    <div className="space-y-6">
      {layers.map((layer, index) => (
        <div
          key={layer.id}
          className="space-y-3 border border-border p-4"
          style={{ opacity: layer.enabled ? 1 : 0.5 }}
        >
          <label className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest">
            <input
              type="checkbox"
              checked={layer.enabled}
              onChange={(e) =>
                updateLayer(layer.id, { enabled: e.target.checked })
              }
              className="accent-cold"
            />
            Layer {String.fromCharCode(65 + index)}
          </label>
          <WaveformSelector
            value={layer.waveform}
            onChange={(waveform: WaveformType) =>
              updateLayer(layer.id, { waveform })
            }
          />
          <ParamSlider
            label="Frequency"
            value={layer.frequency}
            min={30}
            max={1000}
            step={1}
            unit=" Hz"
            onChange={(frequency) => updateLayer(layer.id, { frequency })}
          />
          <ParamSlider
            label="Gain"
            value={layer.gain}
            min={0}
            max={1}
            step={0.01}
            onChange={(gain) => updateLayer(layer.id, { gain })}
          />
          <ParamSlider
            label="Cutoff"
            value={layer.cutoff}
            min={100}
            max={4000}
            step={10}
            unit=" Hz"
            onChange={(cutoff) => updateLayer(layer.id, { cutoff })}
          />
        </div>
      ))}
    </div>
  );
}
