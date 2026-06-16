"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const SWEEP_DEG = 270;
/** Gap at 9 o'clock — min ~10:30, max ~7:30 (rotated off bottom). */
const START_DEG = 315;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number, step: number) {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

function valueToAngle(value: number, min: number, max: number) {
  const t = (value - min) / (max - min || 1);
  return START_DEG + t * SWEEP_DEG;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export type RadialKnobProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
  size?: number;
};

export function RadialKnob({
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = "",
  onChange,
  className,
  size = 52,
}: RadialKnobProps) {
  const dragRef = useRef<{ y: number; value: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { y: e.clientY, value };
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const dy = dragRef.current.y - e.clientY;
      const range = max - min;
      const next = snap(
        clamp(dragRef.current.value + (dy / 100) * range, min, max),
        step
      );
      onChange(next);
    },
    [max, min, onChange, step]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const angle = valueToAngle(value, min, max);
  const indicator = polar(24, 24, 16, angle);
  const valueArc = arcPath(24, 24, 18, START_DEG, angle);
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;

  return (
    <div
      className={cn(
        "module-knob nodrag nopan flex flex-col items-center gap-0.5",
        className
      )}
    >
      <span className="module-knob__readout font-mono text-[9px] tabular-nums text-[var(--module-accent)]">
        {value.toFixed(decimals)}
        {unit}
      </span>
      <div
        className="module-knob__body touch-none select-none"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="#0a0810"
            stroke="#2a2038"
            strokeWidth="1.5"
          />
          <path
            d={arcPath(24, 24, 18, START_DEG, START_DEG + SWEEP_DEG)}
            fill="none"
            stroke="#1e1830"
            strokeWidth="3"
            strokeLinecap="square"
          />
          <path
            d={valueArc}
            fill="none"
            stroke="var(--module-accent)"
            strokeWidth="3"
            strokeLinecap="square"
            opacity="0.85"
          />
          {Array.from({ length: 9 }).map((_, i) => {
            const tickAngle = START_DEG + (i / 8) * SWEEP_DEG;
            const a = polar(24, 24, 14, tickAngle);
            const b = polar(24, 24, 17, tickAngle);
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#3a3548"
                strokeWidth="1"
              />
            );
          })}
          <line
            x1="24"
            y1="24"
            x2={indicator.x}
            y2={indicator.y}
            stroke="var(--module-accent)"
            strokeWidth="2"
            strokeLinecap="square"
          />
          <circle cx="24" cy="24" r="3" fill="#1a1624" stroke="var(--module-accent)" strokeWidth="1" />
        </svg>
      </div>
      <span className="module-knob__label text-center text-[8px] uppercase tracking-[0.18em] text-secondary/75">
        {label}
      </span>
    </div>
  );
}
