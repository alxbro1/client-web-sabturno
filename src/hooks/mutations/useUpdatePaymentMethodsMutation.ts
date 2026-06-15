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
    onSuccess: (updated, variables) => {
      // 1) Refrescar el query del "home" del local (si está cacheado).
      queryClient.invalidateQueries({
        queryKey: queryKeys.localHome(variables.localId),
      });

      // 2) Refrescar el `user` del store de auth si el local actualizado
      //    es el del usuario logueado.
      if (user?.id === variables.localId) {
        updateUserProfile({
          mercadoPagoLiveMode: updated.mercadoPagoLiveMode,
          payWithTalo: updated.payWithTalo,
          payWithReservation: updated.payWithReservation,
          reservationPercentage: updated.reservationPercentage,
          payWithCashInFront: updated.payWithCashInFront,
        });
      }
    },
  });
}
