"use client";

/**
 * `useUpdatePaymentMethodsMutation` — mutación para guardar los flags de
 * métodos de cobro de un local vía `PATCH /local/:id`.
 *
 * Se usa desde la pantalla `/local/payment-methods` (feature
 * `payment-methods`). El `onSuccess` invalida el query del `Local`
 * (`useLocalQuery`) para que el form y el resto de la UI (sidebar, booking
 * flow, etc.) reflejen el cambio sin tener que re-loguear.
 *
 * **Decisión arquitectónica**: la session de NextAuth no expone los flags
 * de `Local`, así que antes se intentaba propagarlos vía
 * `useSession().update(...)`, que era un no-op silencioso. Ahora el
 * source of truth es `useLocalQuery` (ver `useLocalQuery.ts`).
 *
 * Sigue el patrón de `useCreateAppointmentMutation`
 * (`src/hooks/mutations/`) y el de mutaciones del mobile.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localService } from "@/features/local/services/local.service";
import { queryKeys } from "@/lib/queryKeys";
import type { Local } from "@/lib/types/local";
import type { UpdatePaymentMethodsPayload } from "@/features/payment-methods";

interface MutationContext {
  /** Local al que se le aplican los cambios (default: `user.id`). */
  localId: string;
}

export function useUpdatePaymentMethodsMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Local,
    Error,
    UpdatePaymentMethodsPayload & MutationContext
  >({
    mutationFn: ({ localId, ...payload }) =>
      localService.updateLocal(localId, payload),
    onSuccess: (updated, variables) => {
      // Source of truth: el `Local` traído por React Query. Invalida el
      // query para que el form y el resto de la UI se re-sincronicen.
      queryClient.invalidateQueries({
        queryKey: queryKeys.local(variables.localId),
      });
      // El `localHome` también se beneficia del refresh (podría mostrar
      // contadores basados en flags de pago en el futuro).
      queryClient.invalidateQueries({
        queryKey: queryKeys.localHome(variables.localId),
      });
      // Seteamos el cache con la respuesta del backend para que el form
      // se re-sincronice sin esperar al round-trip del refetch.
      queryClient.setQueryData<Local>(
        queryKeys.local(variables.localId),
        updated,
      );
    },
  });
}
