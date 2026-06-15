"use client";

import { useEffect, useRef } from "react";
import type * as Tone from "tone";

type SpectrographProps = {
  analyser: Tone.Analyser | null;
  isActive: boolean;
  className?: string;
};

function magnitudeToColor(value: number): string {
  const intensity = Math.max(0, Math.min(1, (value + 100) / 100));
  const lightness = 10 + intensity * 70;
  return `hsl(200, 90%, ${lightness}%)`;
}

export function Spectrograph({
  analyser,
  isActive,
  className,
}: SpectrographProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !isActive) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const values = analyser.getValue() as Float32Array;
      const binHeight = height / values.length;

      ctx.drawImage(canvas, 1, 0, width - 1, height, 0, 0, width - 1, height);
      ctx.fillStyle = "#0a0612";
      ctx.fillRect(width - 1, 0, 1, height);

      for (let i = 0; i < values.length; i++) {
        ctx.fillStyle = magnitudeToColor(values[i]);
        const y = height - (i + 1) * binHeight;
        ctx.fillRect(width - 1, y, 1, binHeight);
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [analyser, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={200}
      className={className}
      aria-label="Spectrograph — frequency over time"
    />
  );
}
