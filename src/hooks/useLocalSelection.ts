import { useCallback, useEffect, useRef, useState } from "react";
import { localService, type LocalesPaginated } from "@/services/local";
import type { Local } from "@/lib/types/local";

export function useLocalSelection(pageLimit = 10) {
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const inFlightRef = useRef(false);
  const nextCursorRef = useRef<string | null>(null);

  const uniqueById = (items: Local[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = String(item.id);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const fetchLocales = useCallback(
    async (reset = false) => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const cursor = reset ? undefined : nextCursorRef.current ?? undefined;
        const data: LocalesPaginated = await localService.getLocales({
          cursor,
          limit: pageLimit,
        });

        nextCursorRef.current = data.nextCursor || null;
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.nextCursor));

        if (reset) {
          setLocales(uniqueById(data.items));
        } else {
          setLocales((prev) => uniqueById([...prev, ...data.items]));
        }
      } catch {
        setError("Error al cargar locales");
        if (reset) {
          setLocales([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        inFlightRef.current = false;
      }
    },
    [pageLimit],
  );

  useEffect(() => {
    fetchLocales(true).catch(console.error);
  }, [fetchLocales]);

  return {
    selectedLocal,
    locales,
    loading,
    error,
    loadingMore,
    hasMore,
    handleLocalSelect: setSelectedLocal,
    onRefresh: () => fetchLocales(true),
    onEndReached: () => fetchLocales(false),
  };
}