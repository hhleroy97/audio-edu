"use client";

import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

const DELETE_KEYS = new Set(["Delete", "Backspace"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "SELECT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable
  );
}

/** Delete selected nodes/edges when Delete or Backspace is pressed. */
export function PatchKeyboardHandler() {
  const { deleteElements, getNodes, getEdges } = useReactFlow();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!DELETE_KEYS.has(event.key)) return;
      if (isEditableTarget(event.target)) return;

      const selectedNodes = getNodes().filter((node) => node.selected);
      const selectedEdges = getEdges().filter((edge) => edge.selected);

      if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

      event.preventDefault();
      void deleteElements({ nodes: selectedNodes, edges: selectedEdges });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteElements, getNodes, getEdges]);

  return null;
}
