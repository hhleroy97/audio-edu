"use client";

import { useEffect, useRef } from "react";

type OscilloscopeProps = {
  analyser: AnalyserNode | null;
  isActive: boolean;
  sampleRate: number;
  className?: string;
};

const MARGIN = { top: 16, right: 12, bottom: 28, left: 44 };

export function Oscilloscope({
  analyser,
  isActive,
  sampleRate,
  className,
}: OscilloscopeProps) {
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

    const buf = new Uint8Array(analyser.fftSize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const plotW = w - MARGIN.left - MARGIN.right;
      const plotH = h - MARGIN.top - MARGIN.bottom;

      analyser.getByteTimeDomainData(buf);

      ctx.fillStyle = "#120d1a";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#2a1f3d";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, MARGIN.top + plotH / 2);
      ctx.lineTo(MARGIN.left + plotW, MARGIN.top + plotH / 2);
      ctx.stroke();

      ctx.fillStyle = "#8a7fa0";
      ctx.font = "10px monospace";
      ctx.fillText("+1", 4, MARGIN.top + 8);
      ctx.fillText("0", 12, MARGIN.top + plotH / 2 + 4);
      ctx.fillText("−1", 6, MARGIN.top + plotH);
      const ms = ((analyser.fftSize / sampleRate) * 1000).toFixed(1);
      ctx.fillText(`${ms} ms`, MARGIN.left + plotW - 40, h - 6);

      ctx.strokeStyle = "#5ec8e8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < buf.length; i++) {
        const x = MARGIN.left + (i / (buf.length - 1)) * plotW;
        const v = (buf[i] - 128) / 128;
        const y = MARGIN.top + plotH / 2 - v * (plotH / 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [analyser, isActive, sampleRate]);

  return (
    <div className={className}>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-secondary">
        Oscilloscope · time vs amplitude
      </p>
      <canvas
        ref={canvasRef}
        width={320}
        height={140}
        className="w-full"
        aria-label="Oscilloscope waveform display"
      />
    </div>
  );
}
