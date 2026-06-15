import { useQuery } from "@tanstack/react-query";
import { taloService, type TaloStatusResponse } from "@/services/talo";
import { queryKeys } from "@/lib/queryKeys";

export function useTaloStatusQuery(localId: string | null | undefined) {
  return useQuery<TaloStatusResponse, Error>({
    queryKey: queryKeys.taloStatus(localId ?? ""),
    queryFn: () => taloService.getStatus(localId!),
    enabled: !!localId,
    staleTime: 60 * 1000,
  });
}
