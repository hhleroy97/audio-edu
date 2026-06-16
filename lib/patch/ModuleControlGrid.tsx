"use client";

import type { NodeKind } from "./ports";
import { isParamUnlocked } from "./param-unlocks";
import { usePatchStore } from "./store";
import { RadialKnob } from "@/lib/ui/RadialKnob";
import { LevelFader } from "@/lib/ui/LevelFader";
import { cn } from "@/lib/utils";

export type KnobControlSpec = {
  type: "knob";
  param: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  area: string;
};

export type FaderControlSpec = {
  type: "fader";
  param: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  area: string;
  tall?: boolean;
};

export type ModuleControlSpec = KnobControlSpec | FaderControlSpec;

type ModuleControlGridProps = {
  kind: NodeKind;
  layout: string;
  controls: ModuleControlSpec[];
  params: Record<string, number | string | boolean>;
  onParamChange: (param: string, value: number) => void;
  className?: string;
};

export function ModuleControlGrid({
  kind,
  layout,
  controls,
  params,
  onParamChange,
  className,
}: ModuleControlGridProps) {
  const mode = usePatchStore((s) => s.mode);
  const lessonSlug = usePatchStore((s) => s.activeLesson.slug);
  const tourStepIndex = usePatchStore((s) => s.tourStepIndex);

  const ctx = { mode, lessonSlug, tourStepIndex };

  const visible = controls.filter((c) =>
    isParamUnlocked(kind, c.param, ctx)
  );

  if (visible.length === 0) return null;

  return (
    <div
      className={cn(
        "module-control-grid",
        `module-control-grid--${layout}`,
        className
      )}
    >
      {visible.map((control) => {
        const value = Number(params[control.param] ?? 0);
        const cellClass = "module-control-grid__cell module-control-grid__cell--reveal";

        if (control.type === "fader") {
          return (
            <div
              key={control.param}
              className={cellClass}
              style={{ gridArea: control.area }}
            >
              <LevelFader
                className="h-full"
                label={control.label}
                value={value}
                min={control.min}
                max={control.max}
                step={control.step}
                tall={control.tall}
                onChange={(v) => onParamChange(control.param, v)}
              />
            </div>
          );
        }

        return (
          <div
            key={control.param}
            className={cellClass}
            style={{ gridArea: control.area }}
          >
            <RadialKnob
              label={control.label}
              value={value}
              min={control.min}
              max={control.max}
              step={control.step}
              unit={control.unit}
              onChange={(v) => onParamChange(control.param, v)}
            />
          </div>
        );
      })}
    </div>
  );
}
