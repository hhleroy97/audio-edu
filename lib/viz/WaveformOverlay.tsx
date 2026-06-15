"use client";

import { useEffect, useRef } from "react";
import type * as Tone from "tone";

type WaveformOverlayProps = {
  analyser: Tone.Analyser | null;
  isActive: boolean;
  className?: string;
  strokeColor?: string;
};

export function WaveformOverlay({
  analyser,
  isActive,
  className,
  strokeColor = "#5ec8e8",
}: WaveformOverlayProps) {
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

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const sliceWidth = width / values.length;
      let x = 0;

      for (let i = 0; i < values.length; i++) {
        const v = (values[i] + 1) / 2;
        const y = v * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.stroke();
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [analyser, isActive, strokeColor]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={120}
      className={className}
      aria-label="Waveform overlay"
    />
  );
}
