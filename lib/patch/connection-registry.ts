/** Connection registry with cycle detection (synflow/plinth pattern). */

export class ConnectionRegistry {
  private forward = new Map<string, Set<string>>();

  register(sourceId: string, targetId: string): void {
    if (!this.forward.has(sourceId)) {
      this.forward.set(sourceId, new Set());
    }
    this.forward.get(sourceId)!.add(targetId);
  }

  unregister(sourceId: string, targetId: string): void {
    this.forward.get(sourceId)?.delete(targetId);
  }

  clear(): void {
    this.forward.clear();
  }

  /** Would connecting source → target create a cycle? */
  wouldCycle(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) return true;
    const visited = new Set<string>();
    const stack = [targetId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (id === sourceId) return true;
      if (visited.has(id)) continue;
      visited.add(id);
      const children = this.forward.get(id);
      if (children) {
        for (const child of children) stack.push(child);
      }
    }
    return false;
  }

  rebuild(edges: { source: string; target: string }[]): void {
    this.clear();
    for (const e of edges) {
      this.register(e.source, e.target);
    }
  }
}
