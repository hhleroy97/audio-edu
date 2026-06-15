"use client";

import { cn } from "@/lib/utils";
import type { WaveformType } from "@/lib/audio";

const WAVEFORMS: { value: WaveformType; label: string }[] = [
  { value: "sine", label: "Sine" },
  { value: "square", label: "Square" },
  { value: "sawtooth", label: "Saw" },
  { value: "triangle", label: "Tri" },
];

type WaveformSelectorProps = {
  value: WaveformType;
  onChange: (value: WaveformType) => void;
  className?: string;
};

export function WaveformSelector({
  value,
  onChange,
  className,
}: WaveformSelectorProps) {
  return (
    <div className={cn("flex gap-1", className)} role="group" aria-label="Waveform">
      {WAVEFORMS.map((wf) => (
        <button
          key={wf.value}
          type="button"
          onClick={() => onChange(wf.value)}
          className={cn(
            "border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
            value === wf.value
              ? "border-cold bg-cold/10 text-cold"
              : "border-border text-secondary hover:border-cold/50 hover:text-primary"
          )}
        >
          {wf.label}
        </button>
      ))}
    </div>
  );
}
