import type { Connection, Edge } from "@xyflow/react";
import type { InternalNode } from "@xyflow/react";
import type { PortType } from "@/lib/schemas/patch";

export type RewireEnd = "source" | "target";

export type RewireAnchor = {
  nodeId: string;
  handleId: string | null;
  handleType: "source" | "target";
};

export type RewireDraft = RewireAnchor & {
  signal: PortType;
  freeEnd: RewireEnd;
};

export type HandleHit = {
  nodeId: string;
  handleId: string | null;
  handleType: "source" | "target";
};

function getHandleBounds(
  node: InternalNode | undefined,
  handleId: string | null | undefined,
  handleType: "source" | "target"
) {
  const boundsList = node?.internals.handleBounds?.[handleType];
  if (!boundsList?.length) return null;
  return (
    boundsList.find((h) => (h.id ?? null) === (handleId ?? null)) ?? boundsList[0]
  );
}

function nodeFlowOrigin(node: InternalNode | undefined) {
  return node?.internals?.positionAbsolute ?? { x: 0, y: 0 };
}

/** Jack center in flow coordinates. */
export function getJackCenter(
  node: InternalNode | undefined,
  handleId: string | null | undefined,
  handleType: "source" | "target"
): { x: number; y: number } | null {
  const handle = getHandleBounds(node, handleId, handleType);
  if (!handle) return null;
  const origin = nodeFlowOrigin(node);
  return {
    x: origin.x + handle.x + handle.width / 2,
    y: origin.y + handle.y + handle.height / 2,
  };
}

/** Cable attach point at bottom of forward-facing jack. */
export function getJackAttachPoint(
  node: InternalNode | undefined,
  handleId: string | null | undefined,
  handleType: "source" | "target"
): { x: number; y: number } | null {
  const handle = getHandleBounds(node, handleId, handleType);
  if (!handle) return null;
  const origin = nodeFlowOrigin(node);
  return {
    x: origin.x + handle.x + handle.width / 2,
    y: origin.y + handle.y + handle.height,
  };
}

/** Pick which jack to free — closest to the double-click point. */
export function pickFreeEnd(
  edge: Edge,
  flowX: number,
  flowY: number,
  getInternalNode: (id: string) => InternalNode | undefined
): RewireEnd {
  const source = getJackCenter(
    getInternalNode(edge.source),
    edge.sourceHandle,
    "source"
  );
  const target = getJackCenter(
    getInternalNode(edge.target),
    edge.targetHandle,
    "target"
  );

  if (!source) return "target";
  if (!target) return "source";

  const ds = (flowX - source.x) ** 2 + (flowY - source.y) ** 2;
  const dt = (flowX - target.x) ** 2 + (flowY - target.y) ** 2;
  return ds <= dt ? "source" : "target";
}

/** Opposite jack stays plugged in while the cable is dragged. */
export function getRewireAnchor(edge: Edge, freeEnd: RewireEnd): RewireAnchor {
  if (freeEnd === "source") {
    return {
      nodeId: edge.target,
      handleId: edge.targetHandle ?? null,
      handleType: "target",
    };
  }
  return {
    nodeId: edge.source,
    handleId: edge.sourceHandle ?? null,
    handleType: "source",
  };
}

export function flowPointFromClient(
  clientX: number,
  clientY: number,
  transform: [number, number, number]
) {
  return {
    x: (clientX - transform[0]) / transform[2],
    y: (clientY - transform[1]) / transform[2],
  };
}

/** Find the jack under the cursor when dropping a rewiring cable. */
export function findHandleUnderPoint(
  clientX: number,
  clientY: number,
  rootSelector = ".patch-lab-canvas"
): HandleHit | null {
  const root = document.querySelector(rootSelector);
  if (!root) return null;

  for (const el of document.elementsFromPoint(clientX, clientY)) {
    if (!(el instanceof Element) || !root.contains(el)) continue;

    const handle = el.closest(
      ".react-flow__handle[data-nodeid][data-handleid]"
    ) as HTMLElement | null;
    if (!handle) continue;

    const dataId = handle.getAttribute("data-id") ?? "";
    const handleType: HandleHit["handleType"] = dataId.endsWith("-target")
      ? "target"
      : "source";

    const nodeId = handle.getAttribute("data-nodeid");
    if (!nodeId) continue;

    return {
      nodeId,
      handleId: handle.getAttribute("data-handleid"),
      handleType,
    };
  }

  return null;
}

/** Build a full connection from anchored jack + jack under cursor. */
export function buildRewireConnection(
  draft: RewireDraft,
  hit: HandleHit
): Connection | null {
  if (draft.handleType === hit.handleType) return null;

  if (draft.handleType === "source") {
    return {
      source: draft.nodeId,
      sourceHandle: draft.handleId,
      target: hit.nodeId,
      targetHandle: hit.handleId,
    };
  }

  return {
    source: hit.nodeId,
    sourceHandle: hit.handleId,
    target: draft.nodeId,
    targetHandle: draft.handleId,
  };
}

export function parseEdgeSignal(edge: Edge): PortType {
  const signal = edge.data?.signal;
  if (signal === "audio" || signal === "cv" || signal === "trigger") {
    return signal;
  }
  return "audio";
}
