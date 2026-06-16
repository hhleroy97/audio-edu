"use client";

import { useEffect, useRef } from "react";
import { spectralCentroidHz, rmsFromTimeDomain } from "./spectral-metrics";

type SpectrumDisplayProps = {
  analyser: AnalyserNode | null;
  isActive: boolean;
  sampleRate: number;
  className?: string;
};

const MARGIN = { top: 16, right: 12, bottom: 28, left: 48 };

function hzToX(hz: number, plotW: number, minHz = 20, maxHz = 20000): number {
  const logMin = Math.log10(minHz);
  const logMax = Math.log10(maxHz);
  const t = (Math.log10(Math.max(minHz, hz)) - logMin) / (logMax - logMin);
  return t * plotW;
}

export function SpectrumDisplay({
  analyser,
  isActive,
  sampleRate,
  className,
}: SpectrumDisplayProps) {
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
    const timeBuf = new Uint8Array(analyser.fftSize);
    const minDb = analyser.minDecibels;
    const maxDb = analyser.maxDecibels;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const plotW = w - MARGIN.left - MARGIN.right;
      const plotH = h - MARGIN.top - MARGIN.bottom;

      analyser.getByteFrequencyData(buf);
      analyser.getByteTimeDomainData(timeBuf);
      const centroid = spectralCentroidHz(buf, sampleRate, analyser.fftSize);
      const rms = rmsFromTimeDomain(timeBuf);

      ctx.fillStyle = "#120d1a";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#2a1f3d";
      ctx.lineWidth = 1;
      for (const hz of [100, 1000, 10000]) {
        const x = MARGIN.left + hzToX(hz, plotW);
        ctx.beginPath();
        ctx.moveTo(x, MARGIN.top);
        ctx.lineTo(x, MARGIN.top + plotH);
        ctx.stroke();
      }

      ctx.fillStyle = "#8a7fa0";
      ctx.font = "10px monospace";
      ctx.fillText("0 dBFS", 4, MARGIN.top + 8);
      ctx.fillText(`${minDb} dBFS`, 4, MARGIN.top + plotH);
      ctx.fillText("20 Hz", MARGIN.left, h - 6);
      ctx.fillText("20 kHz", MARGIN.left + plotW - 36, h - 6);
      ctx.fillStyle = "#5ec8e8";
      ctx.fillText(
        `centroid ${Math.round(centroid)} Hz · rms ${rms.toFixed(2)}`,
        MARGIN.left,
        MARGIN.top + 10
      );

      const barW = plotW / buf.length;
      for (let i = 1; i < buf.length; i++) {
        const f0 = ((i - 1) * sampleRate) / analyser.fftSize;
        const f1 = (i * sampleRate) / analyser.fftSize;
        const x0 = MARGIN.left + hzToX(f0, plotW);
        const x1 = MARGIN.left + hzToX(f1, plotW);
        const db =
          minDb + (buf[i] / 255) * (maxDb - minDb);
        const norm = Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
        const barH = norm * plotH;
        ctx.fillStyle = "#5ec8e8";
        ctx.fillRect(x0, MARGIN.top + plotH - barH, Math.max(1, x1 - x0), barH);
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
        FFT Spectrum · log Hz vs dBFS
      </p>
      <canvas
        ref={canvasRef}
        width={320}
        height={160}
        className="w-full"
        aria-label="FFT spectrum display"
      />
    </div>
  );
}
