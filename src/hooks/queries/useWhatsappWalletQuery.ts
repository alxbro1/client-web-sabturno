"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { whatsappBillingService } from "@/services/whatsappBilling";

export function useWhatsappWalletQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.whatsappWallet(),
    queryFn: () => whatsappBillingService.getWallet(),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateCreditPackCheckoutMutation() {
  return useMutation({
    mutationFn: (creditsCount: number) =>
      whatsappBillingService.createCreditPackCheckout(creditsCount),
  });
}

export function useCreatePostpaidSettlementCheckoutMutation() {
  return useMutation({
    mutationFn: () =>
      whatsappBillingService.createPostpaidSettlementCheckout(),
  });
}

export function useReconcileWhatsappOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string; paymentId?: string }) =>
      whatsappBillingService.reconcileOrder(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.whatsappWallet() });
    },
  });
}
