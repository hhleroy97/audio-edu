"use client";

import { cn } from "@/lib/utils";

export type LevelFaderProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  tall?: boolean;
};

/** Vertical level strip — master bus / VCA style (not a rotary knob). */
export function LevelFader({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  className,
  tall = false,
}: LevelFaderProps) {
  const pct = Math.round(((value - min) / (max - min || 1)) * 100);

  return (
    <div
      className={cn(
        "module-fader-v nodrag nopan flex flex-col items-center gap-1",
        tall && "module-fader-v--tall",
        className
      )}
    >
      <span className="font-mono text-[9px] tabular-nums text-[var(--module-accent)]">
        {pct}
      </span>
      <div className="module-fader-v__track relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="module-fader-v__input"
          aria-label={label}
        />
      </div>
      <span className="module-label text-[8px]">{label}</span>
    </div>
  );
}
