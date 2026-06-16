"use client";

import { useEffect, useState } from "react";
import { usePatchStore } from "./store";

/** Live effective AudioParam value when CV is connected; undefined when static. */
export function useLiveParamModulation(
  nodeId: string,
  paramHandle: string,
  isCvConnected: boolean
): number | undefined {
  const [, bump] = useState(0);
  const subscribeModPreview = usePatchStore((s) => s.subscribeModPreview);
  const getLiveParamValue = usePatchStore((s) => s.getLiveParamValue);

  useEffect(() => {
    if (!isCvConnected) return;
    return subscribeModPreview(() => bump((n) => n + 1));
  }, [nodeId, paramHandle, isCvConnected, subscribeModPreview]);

  if (!isCvConnected) return undefined;
  return getLiveParamValue(nodeId, paramHandle);
}
