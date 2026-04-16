// Lightweight route prefetcher using link rel=prefetch and dynamic imports

export type PrefetchHint = {
  path: string;
  importChunk?: () => Promise<unknown>;
};

const supportsPrefetch = (() => {
  if (typeof document === "undefined") return false;
  const link = document.createElement("link");

  return !!(
    link.relList &&
    link.relList.supports &&
    link.relList.supports("prefetch")
  );
})();

export function prefetchUrl(url: string) {
  if (!supportsPrefetch) return;
  const el = document.createElement("link");

  el.rel = "prefetch";
  el.as = "document";
  el.href = url;
  el.crossOrigin = "anonymous";
  document.head.appendChild(el);
}

export function prefetchChunks(hints: PrefetchHint[]) {
  // Fire and forget
  for (const hint of hints) {
    try {
      if (hint.importChunk) {
        hint.importChunk();
      }
    } catch {}
  }
}
