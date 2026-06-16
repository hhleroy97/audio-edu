"use client";

import { cn } from "@/lib/utils";

type ParamSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
  variant?: "default" | "module";
};

export function ParamSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  className,
  variant = "default",
}: ParamSliderProps) {
  const isModule = variant === "module";

  return (
    <label
      className={cn(
        "flex flex-col gap-2",
        isModule && "module-param gap-1.5",
        className
      )}
    >
      <span
        className={cn(
          "flex justify-between font-mono text-xs uppercase tracking-wider",
          isModule
            ? "module-label text-[9px] text-secondary/80"
            : "text-secondary"
        )}
      >
        <span>{label}</span>
        <span className={isModule ? "text-[var(--module-accent)]" : "text-cold"}>
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full cursor-pointer appearance-none",
          isModule
            ? "module-fader h-2 bg-[#1a1428]"
            : "h-1 bg-border accent-cold"
        )}
      />
    </label>
  );
}
