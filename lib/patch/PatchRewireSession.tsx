"use client";

import { useCallback, useEffect } from "react";
import { useStore, useStoreApi, type Edge, type InternalNode } from "@xyflow/react";
import { usePatchStore } from "@/lib/patch/store";
import { PORT_COLORS } from "@/lib/patch/ports";
import { buildPatchCablePath } from "@/lib/patch/cable-path";
import {
  findHandleUnderPoint,
  flowPointFromClient,
  getJackAttachPoint,
  getRewireAnchor,
  pickFreeEnd,
} from "@/lib/patch/edge-rewire";

type PatchEdgeRewireBridgeProps = {
  onReady: (handler: (event: React.MouseEvent, edge: Edge) => void) => void;
};

function PatchRewireOverlay() {
  const draft = usePatchStore((s) => s.rewireDraft);
  const cursor = usePatchStore((s) => s.rewireCursor);
  const transform = useStore((s) => s.transform);
  const nodeLookup = useStore((s) => s.nodeLookup);

  if (!draft || !cursor) return null;

  const anchorNode = nodeLookup.get(draft.nodeId) as InternalNode | undefined;
  const anchor = getJackAttachPoint(
    anchorNode,
    draft.handleId,
    draft.handleType
  );
  if (!anchor) return null;

  const path = buildPatchCablePath(anchor.x, anchor.y, cursor.x, cursor.y);
  const color = PORT_COLORS[draft.signal];

  return (
    <svg
      className="patch-rewire-overlay pointer-events-none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        zIndex: 1003,
      }}
      aria-hidden
    >
      <g
        transform={`translate(${transform[0]},${transform[1]}) scale(${transform[2]})`}
      >
        <path
          d={path}
          fill="none"
          stroke="#0a0612"
          strokeWidth={6}
          strokeLinecap="square"
        />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="square"
        />
        <rect
          x={anchor.x - 3}
          y={anchor.y - 3}
          width={6}
          height={6}
          fill="#0a0612"
          stroke={color}
          strokeWidth={1.5}
        />
      </g>
    </svg>
  );
}

/** Double-click rewire: keep one jack, drag cable to a new target. */
export function PatchRewireSession({ onReady }: PatchEdgeRewireBridgeProps) {
  const store = useStoreApi();
  const rewireDraft = usePatchStore((s) => s.rewireDraft);
  const beginRewire = usePatchStore((s) => s.beginRewire);
  const updateRewireCursor = usePatchStore((s) => s.updateRewireCursor);
  const completeRewire = usePatchStore((s) => s.completeRewire);
  const cancelRewire = usePatchStore((s) => s.cancelRewire);

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      event.stopPropagation();

      const { transform, nodeLookup } = store.getState();
      const flow = flowPointFromClient(event.clientX, event.clientY, transform);
      const getInternalNode = (id: string) =>
        nodeLookup.get(id) as InternalNode | undefined;

      const freeEnd = pickFreeEnd(edge, flow.x, flow.y, getInternalNode);
      const anchor = getRewireAnchor(edge, freeEnd);

      beginRewire(edge, anchor, freeEnd, flow);
    },
    [beginRewire, store]
  );

  useEffect(() => {
    onReady(onEdgeDoubleClick);
    return () => onReady(() => {});
  }, [onEdgeDoubleClick, onReady]);

  useEffect(() => {
    if (!rewireDraft) return;

    const onMove = (event: PointerEvent) => {
      const { transform } = store.getState();
      updateRewireCursor(
        flowPointFromClient(event.clientX, event.clientY, transform)
      );
    };

    const onUp = (event: PointerEvent) => {
      const hit = findHandleUnderPoint(event.clientX, event.clientY);
      if (hit) {
        completeRewire(hit);
        return;
      }
      cancelRewire();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRewire();
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    rewireDraft,
    store,
    updateRewireCursor,
    completeRewire,
    cancelRewire,
  ]);

  return <PatchRewireOverlay />;
}
