"use client";

import { useEffect, useRef } from "react";
import { sampleEnvelopeCurve, type ADSRParams } from "@/lib/audio/envelope";

type EnvelopeCurveProps = {
  adsr: ADSRParams;
  className?: string;
};

export function EnvelopeCurve({ adsr, className }: EnvelopeCurveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const samples = sampleEnvelopeCurve(adsr);
    const maxLevel = Math.max(adsr.pitchAmount, 1);

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#5ec8e8";
    ctx.lineWidth = 2;
    ctx.beginPath();

    samples.forEach((s, i) => {
      const x = (s.t / 2) * width;
      const y = height - (s.level / maxLevel) * (height - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    ctx.fillStyle = "#8a7fa0";
    ctx.font = "10px monospace";
    ctx.fillText("pitch offset (semitones)", 4, 12);
  }, [adsr]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={140}
      className={className}
      aria-label="Pitch envelope curve"
    />
  );
}
