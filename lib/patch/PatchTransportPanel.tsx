"use client";

import { syncedLfoHz } from "@/lib/patch/transport";
import { usePatchStore } from "@/lib/patch/store";

const GRID_DIVISIONS = ["1/2", "1/4", "1/8", "1/8t"] as const;

export function PatchTransportPanel() {
  const transportBpm = usePatchStore((s) => s.transportBpm);
  const setTransportBpm = usePatchStore((s) => s.setTransportBpm);
  const isRunning = usePatchStore((s) => s.isRunning);
  const recordResample = usePatchStore((s) => s.recordResample);

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
      <div className="mt-3 grid grid-cols-4 gap-1">
        {GRID_DIVISIONS.map((div) => (
          <div
            key={div}
            className="border border-module-border bg-module-header px-1 py-1 text-center font-mono text-[8px] text-secondary"
            title={`${syncedLfoHz(transportBpm, div).toFixed(2)} Hz`}
          >
            {div}
            <div className="text-[7px] text-cold">
              {syncedLfoHz(transportBpm, div).toFixed(1)}Hz
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void recordResample(2)}
        className="nodrag nopan mt-3 w-full border-2 border-hot bg-module-header px-2 py-1 font-mono text-[9px] uppercase text-hot hover:bg-hot/10"
      >
        resample 2s → sampler
      </button>
      <p className="mt-2 text-[8px] leading-snug text-secondary/80">
        Halftime grid shows sync Hz at {transportBpm} BPM.
        {isRunning ? "" : " · Run to hear synced LFOs."}
      </p>
    </div>
  );
}
