import { useCallback, useEffect, useRef, useState } from "react";
import { api, type FixedBatch, type FixedMeta } from "./api";

export function useFixedData() {
  const [meta, setMeta] = useState<FixedMeta | null>(null);
  const [batches, setBatches] = useState<FixedBatch[]>([]);
  const [detail, setDetail] = useState<FixedBatch | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const selected = useRef<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const revision = useRef(0);
  const failures = useRef(0);

  const refresh = useCallback(async (force = false) => {
    if (!mounted.current) return;
    if (request.current) {
      if (!force) return;
      request.current.abort();
      request.current = null;
      revision.current += 1;
    }
    const controller = new AbortController();
    request.current = controller;
    const readingRevision = revision.current;
    const readingId = selected.current;
    setRefreshing(true);
    try {
      const [nextMeta, list, nextDetail] = await Promise.all([
        api.meta(controller.signal), api.batches(controller.signal),
        readingId ? api.batch(readingId, controller.signal) : Promise.resolve(null),
      ]);
      if (!mounted.current || controller.signal.aborted) return;
      // A GET started before a mutation may be stale. Never overwrite the newer result.
      if (readingRevision !== revision.current) return;
      setMeta(nextMeta);
      setBatches(list.items);
      if (selected.current === readingId) setDetail(nextDetail);
      setReadError(null);
      setUpdatedAt(new Date());
      failures.current = 0;
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      failures.current += 1;
      setReadError((error as Error).message);
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (mounted.current) { setLoading(false); setRefreshing(false); }
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    let generation = 0;
    async function tick(currentGeneration: number) {
      if (stopped || currentGeneration !== generation) return;
      if (!document.hidden) await refresh();
      if (!stopped && currentGeneration === generation) timer = setTimeout(() => void tick(currentGeneration), Math.min(60_000, 10_000 * (2 ** failures.current)));
    }
    const onVisible = () => { if (!document.hidden) { clearTimeout(timer); generation += 1; void tick(generation); } };
    void tick(generation);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      mounted.current = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      request.current?.abort();
      request.current = null;
    };
  }, [refresh]);

  const select = useCallback((id: string) => {
    selected.current = id;
    setSelectedId(id);
    setDetail(null);
    revision.current += 1;
    request.current?.abort();
    request.current = null;
    void refresh();
  }, [refresh]);

  const acceptBatch = useCallback((batch: FixedBatch) => {
    revision.current += 1;
    setBatches((current) => [batch, ...current.filter((item) => item.id !== batch.id)]);
    selected.current = batch.id;
    setSelectedId(batch.id);
    setDetail(batch);
    request.current?.abort();
    request.current = null;
    void refresh();
  }, [refresh]);

  return { meta, batches, detail, selectedId, loading, refreshing, readError, updatedAt, refresh, select, acceptBatch };
}
