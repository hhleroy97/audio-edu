"use client";

import { getModuleTheme } from "@/lib/patch/module-theme";
import type { NodeKind } from "@/lib/patch/ports";

type ModulePaletteProps = {
  kinds: NodeKind[];
  onAdd: (kind: NodeKind) => void;
};

export function ModulePalette({ kinds, onAdd }: ModulePaletteProps) {
  return (
    <div className="flex flex-wrap gap-1.5 p-1">
      {kinds.map((kind) => {
        const theme = getModuleTheme(kind);
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onAdd(kind)}
            className="module-palette-tile border-2 border-module-border bg-module-fill px-2 py-1 text-[9px] uppercase text-secondary hover:border-cold hover:text-primary"
            title={`Add ${kind}`}
          >
            <span className="mr-1 font-bold text-cold">+</span>
            <span className="font-bold text-primary">{theme.code}</span>
          </button>
        );
      })}
    </div>
  );
}
