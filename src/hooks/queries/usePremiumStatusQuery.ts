"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { premiumService } from "@/services/premium";
import { useAuthStore } from "@/stores/auth";

export function usePremiumStatusQuery() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.premiumStatus(),
    queryFn: () => premiumService.getStatus(),
    enabled: !!user?.isLocal,
    staleTime: 30_000,
    retry: 1,
  });
}
