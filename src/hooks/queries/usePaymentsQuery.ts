"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { userService } from "@/services/user";
import type { UserPayment } from "@/lib/types/user";

async function fetchPayments(): Promise<UserPayment[]> {
  return userService.getMyPayments();
}

export function usePaymentsQuery() {
  return useQuery({
    queryKey: queryKeys.userPayments(),
    queryFn: fetchPayments,
    staleTime: 30_000,
  });
}
