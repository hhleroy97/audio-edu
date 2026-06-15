"use client";

import { useEffect, useRef } from "react";
import type * as Tone from "tone";

type FFTDisplayProps = {
  analyser: Tone.Analyser | null;
  isActive: boolean;
  className?: string;
  barColor?: string;
};

function dbToHeight(db: number, height: number) {
  const normalized = Math.max(0, Math.min(1, (db + 100) / 100));
  return normalized * height;
}

export function FFTDisplay({
  analyser,
  isActive,
  className,
  barColor = "#5ec8e8",
}: FFTDisplayProps) {
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
      const barWidth = width / values.length;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = barColor;

      for (let i = 0; i < values.length; i++) {
        const barHeight = dbToHeight(values[i], height);
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [analyser, isActive, barColor]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={180}
      className={className}
      aria-label="FFT frequency display"
    />
  );
}
