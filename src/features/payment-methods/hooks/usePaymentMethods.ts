"use client";

/**
 * `usePaymentMethods` — orquestador de la pantalla de configuración de
 * métodos de cobro.
 *
 * Es el equivalente (adaptado a React + TanStack Query) del componente
 * `ReceiptMethods.tsx` de la app móvil. Centraliza:
 *
 *  - Estado del form (`methodsSelecteds`, `reservationPercentage`).
 *  - Carga del estado de Talo (`useTaloStatusQuery`) y sync inicial.
 *  - Acciones de OAuth: `startMercadoPagoOAuth`, `startTaloOAuth`.
 *  - Lógica condicional al togglear (activar MP dispara OAuth, activar
 *    Reserva sin MP activo dispara OAuth de MP primero, etc.).
 *  - Validación + submit (`save`) vía `useUpdatePaymentMethodsMutation`.
 *
 * Mantener sincronizado con la app móvil
 * (`app/src/features/profile/screens/ReceiptMethods.tsx`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
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
  /** Estado editable del form. */
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

const INITIAL_FORM = (user: ReturnType<typeof useAuthStore.getState>["user"]): PaymentMethodsFormState => ({
  mercadoPagoLiveMode: !!user?.mercadoPagoLiveMode,
  payWithTalo: !!user?.payWithTalo,
  payWithReservation: !!user?.payWithReservation,
  payWithCashInFront: !!user?.payWithCashInFront,
  reservationPercentage:
    user?.reservationPercentage != null ? String(user.reservationPercentage) : "",
});

export function usePaymentMethods(
  options: UsePaymentMethodsOptions = {},
): UsePaymentMethodsResult {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const localId = user?.id ?? null;

  const [form, setForm] = useState<PaymentMethodsFormState>(() => INITIAL_FORM(user));
  const [error, setError] = useState<string | null>(null);

  // El `useState` solo corre en el primer render. En web el store de auth
  // se rehidrata asincrónicamente, así que si el primer render ocurre con
  // `user === null` (store aún no hidratado) el form queda con todos los
  // flags en `false` para siempre — incluso después de la hidratación.
  // Este effect re-sincroniza el form una sola vez cuando el store pasa
  // a tener un user. Usamos un ref para no pisar ediciones del
  // local-owner en renders posteriores.
  const hasSyncedFromStoreRef = useRef(hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (hasSyncedFromStoreRef.current) return;
    if (!user) return;
    setForm(INITIAL_FORM(user));
    hasSyncedFromStoreRef.current = true;
  }, [hasHydrated, user]);

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
    form,
    toggle,
    setReservationPercentage: (value) =>
      setForm((prev) => ({ ...prev, reservationPercentage: value })),
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
