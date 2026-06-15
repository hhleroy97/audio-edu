"use client";

import { useEffect, useRef } from "react";
import type { WaveformType } from "@/lib/audio";

type WavetableDisplayProps = {
  waveformA: WaveformType;
  waveformB: WaveformType;
  position: number;
  className?: string;
};

function sampleWaveform(type: WaveformType, phase: number): number {
  const t = phase % (2 * Math.PI);
  switch (type) {
    case "sine":
      return Math.sin(t);
    case "square":
      return Math.sin(t) >= 0 ? 1 : -1;
    case "sawtooth":
      return 2 * (t / (2 * Math.PI) - 0.5);
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(t));
    default:
      return Math.sin(t);
  }
}

export function WavetableDisplay({
  waveformA,
  waveformB,
  position,
  className,
}: WavetableDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const mid = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#8a7fa0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const phase = (x / width) * 4 * Math.PI;
      const y = mid - sampleWaveform(waveformA, phase) * (mid - 4);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "#e8343a";
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const phase = (x / width) * 4 * Math.PI;
      const y = mid - sampleWaveform(waveformB, phase) * (mid - 4);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "#5ec8e8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const phase = (x / width) * 4 * Math.PI;
      const a = sampleWaveform(waveformA, phase);
      const b = sampleWaveform(waveformB, phase);
      const mixed = a * (1 - position) + b * position;
      const y = mid - mixed * (mid - 4);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [waveformA, waveformB, position]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={120}
      className={className}
      aria-label="Wavetable morph preview"
    />
  );
}
