"use client";

import { useEffect, useRef } from "react";
import { usePatchStore } from "@/lib/patch/store";

/** Re-layout after lesson changes and once node heights are measured. */
export function PatchLayoutSync() {
  const nodes = usePatchStore((s) => s.nodes);
  const activeLessonSlug = usePatchStore((s) => s.activeLesson.slug);
  const measuredCount = usePatchStore((s) => s.nodeMeasuredSizes.size);
  const relayoutFromMeasurements = usePatchStore((s) => s.relayoutFromMeasurements);
  const relayoutScheduled = useRef(false);

  const nodeIds = nodes.map((n) => n.id).join(",");

  useEffect(() => {
    relayoutScheduled.current = false;
  }, [activeLessonSlug, nodeIds]);

  useEffect(() => {
    const timer = window.setTimeout(() => relayoutFromMeasurements(), 48);
    return () => window.clearTimeout(timer);
  }, [activeLessonSlug, nodeIds, relayoutFromMeasurements]);

  useEffect(() => {
    if (nodes.length === 0) return;
    if (measuredCount < nodes.length) return;
    if (relayoutScheduled.current) return;

    relayoutScheduled.current = true;
    const timer = window.setTimeout(() => {
      relayoutFromMeasurements();
      relayoutScheduled.current = false;
    }, 32);
    return () => {
      window.clearTimeout(timer);
      relayoutScheduled.current = false;
    };
  }, [measuredCount, nodes.length, nodeIds, relayoutFromMeasurements]);

  return null;
}
