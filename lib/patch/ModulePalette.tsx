"use client";

import { getModuleTheme } from "@/lib/patch/module-theme";
import type { NodeKind } from "@/lib/patch/ports";

const PALETTE_LABEL: Partial<Record<NodeKind, string>> = {
  oscillator: "VCO",
  detune: "DST",
  unison: "UNI",
  envelope: "ENV",
  output: "OUT",
  analyser: "SCOPE",
  filter: "VCF",
  wavetable: "WTB",
  mixer: "MIX",
  lfo: "LFO",
};

type ModulePaletteProps = {
  kinds: NodeKind[];
  onAdd: (kind: NodeKind) => void;
};

export function ModulePalette({ kinds, onAdd }: ModulePaletteProps) {
  return (
    <div className="flex flex-wrap gap-1.5 p-1">
      {kinds.map((kind) => {
        const theme = getModuleTheme(kind);
        const code = PALETTE_LABEL[kind] ?? theme.code;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onAdd(kind)}
            className="module-palette-tile border border-[#2a2038] bg-[#0c0a12] px-2.5 py-1.5 text-[9px] uppercase text-secondary hover:text-primary"
            style={
              {
                "--tile-accent": theme.accentDim,
                borderColor: `${theme.accent}44`,
              } as React.CSSProperties
            }
            title={`Add ${kind}`}
          >
            <span style={{ color: theme.accent }} className="mr-1.5 font-bold">
              +
            </span>
            <span style={{ color: theme.accent }}>{code}</span>
          </button>
        );
      })}
    </div>
  );
}
