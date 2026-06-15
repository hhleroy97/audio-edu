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
}: ParamSliderProps) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="flex justify-between font-mono text-xs uppercase tracking-wider text-secondary">
        <span>{label}</span>
        <span className="text-cold">
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
        className="h-1 w-full cursor-pointer appearance-none bg-border accent-cold"
      />
    </label>
  );
}
