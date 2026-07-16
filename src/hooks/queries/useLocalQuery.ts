"use client";

/**
 * `useLocalQuery` — query React Query que trae el `Local` actual
 * (incluyendo los flags de payment methods) vía `GET /local/:id`.
 *
 * Es el **source of truth** para la pantalla `/local/payment-methods` y
 * para cualquier flujo que necesite los flags en tiempo real:
 *
 *   - `mercadoPagoLiveMode`
 *   - `payWithTalo`
 *   - `payWithReservation` + `reservationPercentage`
 *   - `payWithCashInFront`
 *
 * **Por qué existe**: la session de NextAuth no expone estos campos
 * (son data de `Local`, no de `User`). Intentarlos leer de la session
 * daba siempre `undefined` y la pantalla de métodos de cobro arrancaba
 * con todos los toggles en OFF aunque el backend ya los tuviera activos.
 *
 * Mantener sincronizado con el patrón de `useTaloStatusQuery`,
 * `usePremiumStatusQuery`, etc.
 */
import { useQuery } from "@tanstack/react-query";
import { localService } from "@/features/local/services/local.service";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/useAuth";

export function useLocalQuery() {
  const { user } = useAuth();
  const localId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.local(localId),
    queryFn: () => localService.getLocal(localId),
    enabled: !!localId && !!user?.isLocal,
    staleTime: 30_000,
  });
}
