"use client";

import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { usePatchStore } from "@/lib/patch/store";

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

function isUndoShortcut(event: KeyboardEvent): boolean {
  return (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === "z" &&
    !event.shiftKey
  );
}

function isRedoShortcut(event: KeyboardEvent): boolean {
  return (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === "z" &&
    event.shiftKey
  );
}

/** Canvas keyboard shortcuts: delete selection, undo, redo. */
export function PatchKeyboardHandler() {
  const { deleteElements, getNodes, getEdges } = useReactFlow();
  const undo = usePatchStore((s) => s.undo);
  const redo = usePatchStore((s) => s.redo);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      if (isUndoShortcut(event)) {
        event.preventDefault();
        undo();
        return;
      }

      if (isRedoShortcut(event)) {
        event.preventDefault();
        redo();
        return;
      }

      if (!DELETE_KEYS.has(event.key)) return;

      const selectedNodes = getNodes().filter((node) => node.selected);
      const selectedEdges = getEdges().filter((edge) => edge.selected);

      if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

      event.preventDefault();
      void deleteElements({ nodes: selectedNodes, edges: selectedEdges });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteElements, getNodes, getEdges, undo, redo]);

  return null;
}
