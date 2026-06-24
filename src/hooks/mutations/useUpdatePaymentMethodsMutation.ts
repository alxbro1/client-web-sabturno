"use client";

/**
 * `useUpdatePaymentMethodsMutation` — mutación para guardar los flags de
 * métodos de cobro de un local vía `PATCH /local/:id`.
 *
 * Se usa desde la pantalla `/local/payment-methods` (feature
 * `payment-methods`). El `onSuccess` refresca el `useAuthStore.user` con
 * los flags devueltos por el backend, de modo que la UI del sidebar y otras
 * pantallas reflejen el cambio sin tener que re-loguear.
 *
 * Sigue el patrón de `useCreateAppointmentMutation`
 * (`src/hooks/mutations/`) y el de mutaciones del mobile.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localService } from "@/features/local/services/local.service";
import { useAuthStore } from "@/stores/auth";
import { queryKeys } from "@/lib/queryKeys";
import type { Local } from "@/lib/types/local";
import type { UpdatePaymentMethodsPayload } from "@/features/payment-methods";

interface MutationContext {
  /** Local al que se le aplican los cambios (default: `user.id`). */
  localId: string;
}

async function syncSessionWithBackend(data: Record<string, unknown>) {
  try {
    await fetch("/api/auth/update-session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    /* swallow: session sync is best-effort */
  }
}

export function useUpdatePaymentMethodsMutation() {
  const queryClient = useQueryClient();
  const { user, updateUserProfile } = useAuthStore();

  return useMutation<
    Local,
    Error,
    UpdatePaymentMethodsPayload & MutationContext
  >({
    mutationFn: ({ localId, ...payload }) =>
      localService.updateLocal(localId, payload),
    onSuccess: async (updated, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.localHome(variables.localId),
      });

      if (user?.id === variables.localId) {
        const patch = {
          mercadoPagoLiveMode: updated.mercadoPagoLiveMode,
          payWithTalo: updated.payWithTalo,
          payWithReservation: updated.payWithReservation,
          reservationPercentage: updated.reservationPercentage,
          payWithCashInFront: updated.payWithCashInFront,
        };

        await syncSessionWithBackend(patch);

        updateUserProfile(patch);
      }
    },
  });
}
