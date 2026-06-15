"use client";

import { ParamSlider } from "./ParamSlider";
import type { ADSRParams } from "@/lib/audio/envelope";

type EnvelopeEditorProps = {
  value: ADSRParams;
  onChange: (value: ADSRParams) => void;
};

export function EnvelopeEditor({ value, onChange }: EnvelopeEditorProps) {
  const patch = (partial: Partial<ADSRParams>) =>
    onChange({ ...value, ...partial });

  return (
    <div className="space-y-4">
      <p className="font-mono text-xs uppercase tracking-widest text-secondary">
        ADSR · pitch envelope
      </p>
      <ParamSlider
        label="Attack"
        value={value.attack}
        min={0.01}
        max={1}
        step={0.01}
        unit=" s"
        onChange={(attack) => patch({ attack })}
      />
      <ParamSlider
        label="Decay"
        value={value.decay}
        min={0.01}
        max={1}
        step={0.01}
        unit=" s"
        onChange={(decay) => patch({ decay })}
      />
      <ParamSlider
        label="Sustain"
        value={value.sustain}
        min={0}
        max={1}
        step={0.01}
        onChange={(sustain) => patch({ sustain })}
      />
      <ParamSlider
        label="Release"
        value={value.release}
        min={0.01}
        max={1.5}
        step={0.01}
        unit=" s"
        onChange={(release) => patch({ release })}
      />
      <ParamSlider
        label="Pitch amount"
        value={value.pitchAmount}
        min={0}
        max={24}
        step={1}
        unit=" st"
        onChange={(pitchAmount) => patch({ pitchAmount })}
      />
    </div>
  );
}
