"use client";

import { useEffect, useRef } from "react";

type SpectrogramDisplayProps = {
  analyser: AnalyserNode | null;
  isActive: boolean;
  sampleRate: number;
  className?: string;
};

function magnitudeToColor(byte: number, minDb: number, maxDb: number): string {
  const db = minDb + (byte / 255) * (maxDb - minDb);
  const t = Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
  const lightness = 12 + t * 65;
  return `hsl(200, 90%, ${lightness}%)`;
}

export function SpectrogramDisplay({
  analyser,
  isActive,
  sampleRate,
  className,
}: SpectrogramDisplayProps) {
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

    const buf = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.drawImage(canvas, 1, 0, w - 1, h, 0, 0, w - 1, h);
      ctx.fillStyle = "#0a0612";
      ctx.fillRect(w - 1, 0, 1, h);

      analyser.getByteFrequencyData(buf);
      const minDb = analyser.minDecibels;
      const maxDb = analyser.maxDecibels;
      const rowH = h / buf.length;

      for (let i = 0; i < buf.length; i++) {
        ctx.fillStyle = magnitudeToColor(buf[i], minDb, maxDb);
        const y = h - (i + 1) * rowH;
        ctx.fillRect(w - 1, y, 1, rowH);
      }

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
        Spectrogram · time vs Hz (log) · color = dB
      </p>
      <canvas
        ref={canvasRef}
        width={320}
        height={160}
        className="w-full"
        aria-label="Spectrogram display"
      />
    </div>
  );
}
