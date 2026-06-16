"use client";

import { useEffect, useRef } from "react";
import type { WaveformType } from "@/lib/audio";
import { sampleWaveform } from "@/lib/viz/waveform-sample";

type WaveformShapeProps = {
  waveform: WaveformType;
  className?: string;
  strokeColor?: string;
  samples?: number;
};

export function WaveformShape({
  waveform,
  className,
  strokeColor = "#5ec8e8",
  samples = 128,
}: WaveformShapeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padX = 6;
    const padY = 6;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;
    const midY = padY + plotH / 2;

    ctx.fillStyle = "#120d1a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#2a1f3d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, midY);
    ctx.lineTo(padX + plotW, midY);
    ctx.stroke();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < samples; i++) {
      const phase = (i / (samples - 1)) * 2 * Math.PI;
      const x = padX + (i / (samples - 1)) * plotW;
      const y = midY - sampleWaveform(waveform, phase) * (plotH / 2 - 1);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [waveform, samples, strokeColor]);

  return (
    <canvas
      ref={canvasRef}
      width={168}
      height={52}
      className={className}
      role="img"
      aria-label={`${waveform} waveform shape`}
    />
  );
}
