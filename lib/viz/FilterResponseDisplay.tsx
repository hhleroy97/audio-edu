"use client";

import { useEffect, useRef } from "react";
import { sampleLowpassResponse } from "@/lib/audio/filter";

type FilterResponseDisplayProps = {
  cutoff: number;
  resonance: number;
  className?: string;
};

export function FilterResponseDisplay({
  cutoff,
  resonance,
  className,
}: FilterResponseDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const samples = sampleLowpassResponse(cutoff, resonance);
    const maxFreq = samples[samples.length - 1]?.freq ?? 22050;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#5ec8e8";
    ctx.lineWidth = 2;
    ctx.beginPath();

    samples.forEach((s, i) => {
      const x = (s.freq / maxFreq) * width;
      const y = height - ((s.db + 48) / 48) * (height - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    const cutoffX = (cutoff / maxFreq) * width;
    ctx.strokeStyle = "#e8343a";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cutoffX, 0);
    ctx.lineTo(cutoffX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [cutoff, resonance]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={140}
      className={className}
      aria-label="Filter frequency response"
    />
  );
}
