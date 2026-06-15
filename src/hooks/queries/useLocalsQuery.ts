import { useInfiniteQuery } from "@tanstack/react-query";
import { localService, type LocalesPaginated } from "@/services/local";
import { queryKeys } from "@/lib/queryKeys";
import type { Local } from "@/lib/types/local";

const PAGE_LIMIT = 10;

export function useLocalsQuery() {
  const query = useInfiniteQuery<LocalesPaginated, Error>({
    queryKey: queryKeys.localsAvailable(PAGE_LIMIT),
    queryFn: ({ pageParam }) =>
      localService.getLocales({
        cursor: pageParam as string | undefined,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 30 * 1000,
  });

  const locals: Local[] =
    query.data?.pages.flatMap((page) => page.items) ?? [];

  const uniqueLocals = Array.from(
    new Map(locals.map((item) => [String(item.id), item])).values(),
  );

  const hasMore = query.hasNextPage;

  return {
    locals: uniqueLocals,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error?.message ?? null,
    hasMore,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
