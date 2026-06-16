"use client";

import {
  PATCH_PRESETS,
  RIDDIM_ARCHETYPE_SECTIONS,
} from "@/lib/patch/presets/index";
import { usePatchStore } from "@/lib/patch/store";
import type { PatchPreset } from "@/lib/schemas/patch";

function PresetTile({
  preset,
  onLoad,
}: {
  preset: PatchPreset;
  onLoad: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onLoad(preset.id)}
      className="patch-preset-tile border-2 border-module-border bg-module-fill px-2 py-1.5 text-left hover:border-cold"
      title={preset.description}
    >
      <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-cold">
        {preset.title}
      </span>
      <span className="mt-0.5 block text-[8px] leading-snug text-secondary">
        {preset.techniqueTags.slice(0, 3).join(" · ")}
      </span>
    </button>
  );
}

export function PatchPresetPanel() {
  const loadPreset = usePatchStore((s) => s.loadPreset);
  const isRunning = usePatchStore((s) => s.isRunning);

  const byId = new Map(PATCH_PRESETS.map((p) => [p.id, p]));
  const archetypeIds = new Set<string>(
    RIDDIM_ARCHETYPE_SECTIONS.flatMap((s) => [...s.presetIds])
  );
  const corePresets = PATCH_PRESETS.filter((p) => !archetypeIds.has(p.id));

  const load = (id: string) => {
    loadPreset(id);
    if (!isRunning) void usePatchStore.getState().run();
  };

  return (
    <div className="flex flex-col gap-2 p-1">
      <div>
        <p className="mb-1 px-1 font-mono text-[7px] uppercase tracking-[0.25em] text-secondary">
          core & pro
        </p>
        <div className="flex flex-col gap-1">
          {corePresets.map((preset) => (
            <PresetTile key={preset.id} preset={preset} onLoad={load} />
          ))}
        </div>
      </div>
      {RIDDIM_ARCHETYPE_SECTIONS.map((section) => (
        <div key={section.id}>
          <p className="mb-0.5 px-1 font-mono text-[7px] uppercase tracking-[0.25em] text-hot">
            {section.title}
          </p>
          <p className="mb-1 px-1 text-[7px] leading-snug text-secondary/80">
            {section.description}
          </p>
          <div className="flex flex-col gap-1">
            {section.presetIds.map((id) => {
              const preset = byId.get(id);
              if (!preset) return null;
              return (
                <PresetTile key={id} preset={preset} onLoad={load} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
