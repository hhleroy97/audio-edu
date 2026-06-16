"use client";

import { PATCH_PRESETS } from "@/lib/patch/presets/index";
import { usePatchStore } from "@/lib/patch/store";

export function PatchPresetPanel() {
  const loadPreset = usePatchStore((s) => s.loadPreset);
  const isRunning = usePatchStore((s) => s.isRunning);

  return (
    <div className="flex flex-col gap-1 p-1">
      {PATCH_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => {
            loadPreset(preset.id);
            if (!isRunning) {
              void usePatchStore.getState().run();
            }
          }}
          className="patch-preset-tile border-2 border-module-border bg-module-fill px-2 py-1.5 text-left hover:border-cold"
          title={preset.description}
        >
          <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-cold">
            {preset.title}
          </span>
          <span className="mt-0.5 block text-[8px] leading-snug text-secondary">
            {preset.techniqueTags.join(" · ")}
          </span>
        </button>
      ))}
    </div>
  );
}
