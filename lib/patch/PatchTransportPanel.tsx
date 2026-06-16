"use client";

import { DEFAULT_TRANSPORT_BPM } from "@/lib/patch/transport";
import { usePatchStore } from "@/lib/patch/store";

export function PatchTransportPanel() {
  const transportBpm = usePatchStore((s) => s.transportBpm);
  const setTransportBpm = usePatchStore((s) => s.setTransportBpm);
  const isRunning = usePatchStore((s) => s.isRunning);

  return (
    <div className="mb-4 border-2 border-module-border bg-module-fill p-2">
      <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-secondary">
        transport
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-[9px] text-secondary">
          Riddim tempo · LFO sync divisions
        </span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={60}
            max={200}
            step={1}
            value={transportBpm}
            onChange={(e) => setTransportBpm(Number(e.target.value))}
            className="nodrag nopan flex-1 accent-cold"
          />
          <span className="w-12 font-mono text-[11px] text-cold">
            {transportBpm}
          </span>
        </div>
      </label>
      <p className="mt-2 text-[8px] leading-snug text-secondary/80">
        Default {DEFAULT_TRANSPORT_BPM} BPM. Synced LFOs use 1/4 = one cycle per
        beat{isRunning ? "" : " · Run to hear"}.
      </p>
    </div>
  );
}
