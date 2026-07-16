"use client";

/**
 * `usePaymentMethods` — orquestador de la pantalla de configuración de
 * métodos de cobro.
 *
 * Es el equivalente (adaptado a React + TanStack Query) del componente
 * `ReceiptMethods.tsx` de la app móvil. Centraliza:
 *
 *  - Estado del form (`form`, derivado del `Local` actual).
 *  - Carga del estado de Talo (`useTaloStatusQuery`) y sync inicial.
 *  - Acciones de OAuth: `startMercadoPagoOAuth`, `startTaloOAuth`.
 *  - Lógica condicional al togglear (activar MP dispara OAuth, activar
 *    Reserva sin MP activo dispara OAuth de MP primero, etc.).
 *  - Validación + submit (`save`) vía `useUpdatePaymentMethodsMutation`.
 *
 * **Source of truth**: `useLocalQuery` (no la session de NextAuth).
 * La session no expone los flags de `Local` y leerlos de ahí daba siempre
 * `undefined`, así que el form quedaba con todos los toggles en OFF
 * aunque ya estuvieran configurados en el backend.
 *
 * Mantener sincronizado con la app móvil
 * (`app/src/features/profile/screens/ReceiptMethods.tsx`).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocalQuery } from "@/hooks/queries/useLocalQuery";
import { useTaloStatusQuery } from "@/hooks/queries/useTaloStatusQuery";
import { taloService } from "@/services/talo";
import { useUpdatePaymentMethodsMutation } from "@/hooks/mutations/useUpdatePaymentMethodsMutation";
import type { MethodKey, PaymentMethodsFormState } from "@/features/payment-methods";

interface UsePaymentMethodsOptions {
  /**
   * Callback invocado justo antes de un redirect de OAuth (MP o Talo).
   * Útil para mostrar un loading state o limpiar errores previos.
   */
  onBeforeRedirect?: () => void;
}

export interface UsePaymentMethodsResult {
  /** ¿Está cargando el `Local` actual? */
  isLoading: boolean;
  /** Estado editable del form (derivado del `Local`). */
  form: PaymentMethodsFormState;
  /** Setter tipado para togglear un flag. */
  toggle: (key: MethodKey) => void;
  /** Setter para el porcentaje de reserva (string libre para input controlado). */
  setReservationPercentage: (value: string) => void;

  /** ¿Está cargando el estado de Talo? */
  isTaloLoading: boolean;
  /** Estado de la cuenta Talo (null mientras carga o si no hay local). */
  taloStatus: {
    connected: boolean;
    accountStatus: string | null;
    taloUserId?: string;
  } | null;

  /** Dispara el OAuth de MercadoPago (top-level redirect). */
  startMercadoPagoOAuth: () => void;
  /** Dispara el OAuth de Talo (popup). */
  startTaloOAuth: () => Promise<void>;
  /** Refresca manualmente el estado de Talo. */
  refreshTaloStatus: () => Promise<void>;

  /** Persiste los cambios del form. Devuelve `true` si se guardó. */
  save: () => Promise<boolean>;
  /** ¿Está en curso la mutación de guardado? */
  isSaving: boolean;
  /** Error de validación o de la mutación (null = sin error). */
  error: string | null;
  /** Limpia el error manualmente (e.g. al empezar a editar). */
  clearError: () => void;
}

const EMPTY_FORM: PaymentMethodsFormState = {
  mercadoPagoLiveMode: false,
  payWithTalo: false,
  payWithReservation: false,
  payWithCashInFront: false,
  reservationPercentage: "",
};

const formFromLocal = (local: {
  mercadoPagoLiveMode?: boolean;
  payWithTalo?: boolean;
  payWithReservation?: boolean;
  payWithCashInFront?: boolean;
  reservationPercentage?: number | null;
} | undefined): PaymentMethodsFormState => ({
  mercadoPagoLiveMode: !!local?.mercadoPagoLiveMode,
  payWithTalo: !!local?.payWithTalo,
  payWithReservation: !!local?.payWithReservation,
  payWithCashInFront: !!local?.payWithCashInFront,
  reservationPercentage:
    local?.reservationPercentage != null
      ? String(local.reservationPercentage)
      : "",
});

export function usePaymentMethods(
  options: UsePaymentMethodsOptions = {},
): UsePaymentMethodsResult {
  const router = useRouter();
  const { user, hasHydrated } = useAuth();
  const localId = user?.id ?? null;

  // Source of truth: el Local traído por React Query.
  const localQuery = useLocalQuery();
  const local = localQuery.data;

  // `form` es el "draft" controlado por el usuario. Lo sincronizamos
  // desde el `Local` en estos dos casos:
  //   1. Primera vez que llega data del backend (post-hidratación).
  //   2. Después de un save exitoso (el mutation hace `invalidateQueries`
  //      → el query re-fetchea → `local` cambia → re-sincronizamos).
  //
  // Si el usuario está editando y el query re-fetchea por algún otro motivo
  // (e.g. refetch en background), `isDirty` evita pisar sus cambios.
  const [form, setForm] = useState<PaymentMethodsFormState>(EMPTY_FORM);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!local) return;
    if (isDirty) return; // no pisar ediciones en curso
    setForm(formFromLocal(local));
  }, [local, isDirty]);

  // 1) Cargar estado de Talo al montar (o cuando el local cambie).
  const taloQuery = useTaloStatusQuery(localId);
  const [isTaloSyncing, setIsTaloSyncing] = useState(false);

  const refreshTaloStatus = useCallback(async () => {
    if (!localId) return;
    setIsTaloSyncing(true);
    try {
      const status = await taloService.getStatus(localId);
      // Si no está conectado o no está ACTIVE, forzar sync contra Talo.
      if (!status.connected || status.accountStatus !== "ACTIVE") {
        try {
          await taloService.syncAccountStatus(localId);
        } catch {
          /* swallow: el sync puede fallar si la cuenta nunca se vinculó */
        }
      }
      // Refrescar el query para que la UI se entere.
      await taloQuery.refetch();
    } finally {
      setIsTaloSyncing(false);
    }
  }, [localId, taloQuery]);

  // Al montar (y cuando llegue el localId), hacer un refresh inicial.
  useEffect(() => {
    if (!hasHydrated) return;
    if (!localId) return;
    refreshTaloStatus();
    // Solo al montar / cuando cambia el localId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, localId]);

  // 2) Acciones de OAuth.

  const startMercadoPagoOAuth = useCallback(() => {
    options.onBeforeRedirect?.();
    const appRedirectUri =
      typeof window !== "undefined"
        ? `${window.location.origin}/local/payment-methods/mp/callback`
        : "";
    const params = new URLSearchParams({ app_redirect_uri: appRedirectUri });
    window.location.href = `/mercadopago/oauth/start?${params.toString()}`;
  }, [options]);

  const startTaloOAuth = useCallback(async () => {
    if (!localId) return;
    setError(null);
    options.onBeforeRedirect?.();

    // El callback de Talo se sirve en una ruta de la SPA para no depender
    // del deep link `sabturno://` (que no funciona en web).
    const appRedirectUri =
      typeof window !== "undefined"
        ? `${window.location.origin}/local/payment-methods/talo/callback`
        : "";

    const url = await taloService.getAuthorizeUrl(localId, appRedirectUri);
    // Popup (ver plan D4). Si el popup es bloqueado, caemos a top-level.
    const popup = window.open(
      url,
      "talo_oauth",
      "noopener,width=600,height=800",
    );
    if (!popup) {
      // Popup bloqueado → top-level redirect como fallback.
      window.location.href = url;
    }
  }, [localId, options]);

  // 3) Toggle de flags con reglas especiales (paridad con mobile).

  const toggle = useCallback(
    (key: MethodKey) => {
      setError(null);
      setIsDirty(true);

      // Regla 1: activar MercadoPago → disparar OAuth de MP.
      if (key === "mercadoPagoLiveMode" && !form.mercadoPagoLiveMode) {
        startMercadoPagoOAuth();
        return;
      }

      // Regla 2: activar Reserva sin MP activo → disparar OAuth de MP primero.
      if (
        key === "payWithReservation" &&
        !form.payWithReservation &&
        !form.mercadoPagoLiveMode
      ) {
        startMercadoPagoOAuth();
        return;
      }

      // Regla 3: activar Talo → disparar OAuth de Talo.
      if (key === "payWithTalo" && !form.payWithTalo) {
        startTaloOAuth();
        return;
      }

      // Regla 4: apagar Reserva → limpiar el %.
      setForm((prev) => {
        const next: PaymentMethodsFormState = { ...prev, [key]: !prev[key] };
        if (key === "payWithReservation" && prev.payWithReservation) {
          next.reservationPercentage = "";
        }
        return next;
      });
    },
    [form.mercadoPagoLiveMode, form.payWithReservation, form.payWithTalo, startMercadoPagoOAuth, startTaloOAuth],
  );

  const setReservationPercentage = useCallback((value: string) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, reservationPercentage: value }));
  }, []);

  // 4) Submit.

  const updateMutation = useUpdatePaymentMethodsMutation();

  const save = useCallback(async (): Promise<boolean> => {
    if (!localId) return false;

    // Validación cliente (espejo de `ReceiptMethods.tsx:167-193` del mobile).
    const reservationEnabled = form.payWithReservation;
    if (reservationEnabled) {
      if (!form.reservationPercentage.trim()) {
        setError(
          "Debes ingresar el porcentaje de reserva para habilitar este metodo.",
        );
        return false;
      }
      const parsed = Number(form.reservationPercentage);
      if (!Number.isFinite(parsed) || parsed < 10 || parsed > 60) {
        setError("El porcentaje de reserva debe estar entre 10% y 60%.");
        return false;
      }
    }

    try {
      await updateMutation.mutateAsync({
        localId,
        mercadoPagoLiveMode: form.mercadoPagoLiveMode,
        payWithTalo: form.payWithTalo,
        payWithReservation: form.payWithReservation,
        payWithCashInFront: form.payWithCashInFront,
        reservationPercentage: reservationEnabled
          ? Math.round(Number(form.reservationPercentage))
          : null,
      });
      // El onSuccess de la mutación invalida `useLocalQuery`. Marcamos el
      // form como "limpio" para que el re-sync (efecto arriba) no se bloquee.
      setIsDirty(false);
      return true;
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "No se pudieron guardar los cambios";
      setError(message);
      return false;
    }
  }, [form, localId, updateMutation]);

  // 5) Derivados.

  const taloStatus = useMemo(() => {
    if (!taloQuery.data) return null;
    return {
      connected: taloQuery.data.connected,
      accountStatus: taloQuery.data.accountStatus ?? null,
      taloUserId: taloQuery.data.taloUserId,
    };
  }, [taloQuery.data]);

  return {
    isLoading: localQuery.isLoading,
    form,
    toggle,
    setReservationPercentage,
    isTaloLoading: taloQuery.isLoading || isTaloSyncing,
    taloStatus,
    startMercadoPagoOAuth,
    startTaloOAuth,
    refreshTaloStatus,
    save,
    isSaving: updateMutation.isPending,
    error,
    clearError: () => setError(null),
  };
}
