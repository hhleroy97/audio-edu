"use client";

import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

type PatchFitViewProps = {
  nodeCount: number;
  lessonSlug: string;
};

/** Re-frame the canvas when the graph grows or a new lesson loads. */
export function PatchFitView({ nodeCount, lessonSlug }: PatchFitViewProps) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void fitView({ padding: 0.18, duration: 320, maxZoom: 1.15 });
    });
    return () => cancelAnimationFrame(frame);
  }, [nodeCount, lessonSlug, fitView]);

  return null;
}
