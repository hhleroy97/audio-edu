"use client";

import { cn } from "@/lib/utils";
import type { WaveformType } from "@/lib/audio";

const WAVEFORMS: { value: WaveformType; label: string; glyph: string }[] = [
  { value: "sine", label: "Sine", glyph: "∿" },
  { value: "square", label: "Square", glyph: "⊓" },
  { value: "sawtooth", label: "Saw", glyph: "⋀" },
  { value: "triangle", label: "Tri", glyph: "△" },
];

type WaveformSelectorProps = {
  value: WaveformType;
  onChange: (value: WaveformType) => void;
  className?: string;
  variant?: "default" | "module";
};

export function WaveformSelector({
  value,
  onChange,
  className,
  variant = "default",
}: WaveformSelectorProps) {
  const isModule = variant === "module";

  return (
    <div
      className={cn(
        "flex w-full gap-0.5",
        isModule && "module-wave-bank border border-[#2a2038] bg-[#08060e] p-0.5",
        className
      )}
      role="group"
      aria-label="Waveform"
    >
      {WAVEFORMS.map((wf) => (
        <button
          key={wf.value}
          type="button"
          title={wf.value}
          onClick={() => onChange(wf.value)}
          className={cn(
            "min-w-0 flex-1 font-mono transition-colors",
            isModule
              ? cn(
                  "py-1.5 text-sm leading-none",
                  value === wf.value
                    ? "bg-[var(--module-accent-dim)] text-[var(--module-accent)] ring-1 ring-[var(--module-accent)]"
                    : "text-secondary/60 hover:bg-[#1a1428] hover:text-primary"
                )
              : cn(
                  "border px-1.5 py-1.5 text-xs uppercase tracking-wider",
                  value === wf.value
                    ? "border-cold bg-cold/10 text-cold"
                    : "border-border text-secondary hover:border-cold/50 hover:text-primary"
                )
          )}
        >
          {isModule ? wf.glyph : wf.label}
        </button>
      ))}
    </div>
  );
}
