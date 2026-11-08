"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  CreditCard,
  History,
  Loader2,
  Lock,
  MessageSquare,
  Sparkles,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumStatusQuery } from "@/hooks/queries/usePremiumStatusQuery";
import {
  useCreateCreditPackCheckoutMutation,
  useCreatePostpaidSettlementCheckoutMutation,
  useReconcileWhatsappOrderMutation,
  useWhatsappWalletQuery,
} from "@/hooks/queries/useWhatsappWalletQuery";
import { formatCurrency, formatLocalDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { WhatsappTransactionType } from "@/services/whatsappBilling";

const UNIT_PRICE_ARS = 15;
const MIN_CUSTOM_CREDITS = 20;
const MAX_CUSTOM_CREDITS = 10000;

interface CreditPackPreset {
  credits: number;
  badge?: string;
  description: string;
}

// Pack prices are derived at render from the wallet's `unitPriceArs`, never
// precomputed here: the backend exposes the price through
// WHATSAPP_MESSAGE_PRICE_ARS, so a baked-in total silently lies when it changes.
const CREDIT_PACK_PRESETS: CreditPackPreset[] = [
  {
    credits: 50,
    description: "Ideal para probar o cubrir semanas tranquilas",
  },
  {
    credits: 150,
    badge: "Habilita pago a mes vencido",
    description: "Supera los $2.000 acumulados en un único pago",
  },
  {
    credits: 300,
    description: "Para locales con flujo constante de turnos",
  },
  {
    credits: 500,
    description: "Para equipos con múltiples profesionales",
  },
];

const TRANSACTION_TYPE_META: Record<
  WhatsappTransactionType,
  { label: string; badgeClass: string }
> = {
  WELCOME_GIFT: {
    label: "Bienvenida",
    badgeClass: "bg-primary/15 text-primary border-primary/30",
  },
  CREDIT_PURCHASE: {
    label: "Recarga",
    badgeClass: "bg-primary/15 text-primary border-primary/30",
  },
  POSTPAID_SETTLEMENT: {
    label: "Liquidación",
    badgeClass: "bg-primary/15 text-primary border-primary/30",
  },
  USAGE_DEBIT: {
    label: "Envío",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
  FAILED_REFUND: {
    label: "Reintegro por fallo",
    badgeClass: "bg-info/15 text-info border-info/30",
  },
  MANUAL_ADJUSTMENT: {
    label: "Ajuste",
    badgeClass: "bg-muted text-foreground border-border",
  },
};

export default function WhatsappCreditsPage() {
  const { hasHydrated, user } = useAuth();
  const isLocal = Boolean(hasHydrated && user?.isLocal);

  const {
    data: wallet,
    isLoading: walletLoading,
    error: walletError,
    refetch: refetchWallet,
  } = useWhatsappWalletQuery(isLocal);

  const { data: premiumStatus } = usePremiumStatusQuery();

  const creditCheckoutMutation = useCreateCreditPackCheckoutMutation();
  const settleCheckoutMutation = useCreatePostpaidSettlementCheckoutMutation();
  const reconcileMutation = useReconcileWhatsappOrderMutation();

  const [selectedCredits, setSelectedCredits] = useState<number>(150);
  const [customCreditsInput, setCustomCreditsInput] = useState<string>("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    kind: "success" | "info" | "error";
    message: string;
  } | null>(null);

  const reconciledOrderRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLocal || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("whatsapp_order_id");
    if (!orderId || reconciledOrderRef.current === orderId) return;

    reconciledOrderRef.current = orderId;
    const paymentId =
      params.get("payment_id") || params.get("collection_id") || undefined;

    reconcileMutation
      .mutateAsync({ orderId, paymentId })
      .then((res) => {
        if (res.reconciled) {
          setFeedbackBanner({
            kind: "success",
            message: `¡Pago acreditado! Se sumaron ${res.order.creditsCount} mensajes a tu cuenta de WhatsApp.`,
          });
          toast.success("Créditos de WhatsApp acreditados correctamente.");
        } else {
          setFeedbackBanner({
            kind: "info",
            message:
              "Tu pago está siendo procesado por Mercado Pago. Tu saldo se actualizará automáticamente en unos instantes.",
          });
        }
      })
      .catch((error) => {
        console.error("Error al reconciliar orden de WhatsApp:", error);
        setFeedbackBanner({
          kind: "error",
          message:
            "No pudimos verificar el estado del pago automáticamente. Podés actualizar la página en unos segundos.",
        });
      })
      .finally(() => {
        window.history.replaceState({}, "", window.location.pathname);
      });
  }, [isLocal, reconcileMutation]);

  if (!hasHydrated || walletLoading) {
    return (
      <div className="min-h-[400px] grid place-items-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user?.isLocal) {
    return (
      <div className="min-h-[400px] grid place-items-center text-center">
        <p className="text-muted-foreground">
          Solo los propietarios de locales pueden gestionar créditos de WhatsApp.
        </p>
      </div>
    );
  }

  const unitPriceArs = wallet?.unitPriceArs ?? UNIT_PRICE_ARS;
  const prepaidCredits = wallet?.prepaidCredits ?? 5;
  const postpaidUsed = wallet?.postpaidUsed ?? 0;
  const postpaidAmountArs = wallet?.postpaidAmountArs ?? 0;
  const totalPurchasedArs = wallet?.totalPurchasedArs ?? 0;
  const unlockThresholdArs = wallet?.postpaidUnlockThresholdArs ?? 2000;
  const postpaidUnlocked = wallet?.postpaidUnlocked ?? false;
  const remainingToUnlockArs = wallet?.remainingToUnlockPostpaidArs ?? 2000;
  const postpaidLimit = wallet?.postpaidLimit ?? 200;
  const billingBlocked = wallet?.billingBlocked ?? false;
  const currentMonthSentCount = wallet?.currentMonthSentCount ?? 0;
  const pendingInvoice = wallet?.pendingInvoice ?? null;
  const recentTransactions = wallet?.recentTransactions ?? [];

  const isUsingCustom = customCreditsInput.trim().length > 0;
  const parsedCustom = Number(customCreditsInput);
  const effectiveCreditsToBuy = isUsingCustom ? parsedCustom : selectedCredits;
  const effectiveTotalArs =
    Number.isFinite(effectiveCreditsToBuy) && effectiveCreditsToBuy > 0
      ? effectiveCreditsToBuy * unitPriceArs
      : 0;

  const unlockProgressPercent = Math.min(
    100,
    Math.round((totalPurchasedArs / unlockThresholdArs) * 100),
  );
  const postpaidUsagePercent = Math.min(
    100,
    Math.round((postpaidUsed / Math.max(1, postpaidLimit)) * 100),
  );

  async function handleBuyCredits() {
    setCustomError(null);
    setFeedbackBanner(null);

    const credits = isUsingCustom ? Number(customCreditsInput) : selectedCredits;
    if (
      !Number.isInteger(credits) ||
      credits < MIN_CUSTOM_CREDITS ||
      credits > MAX_CUSTOM_CREDITS
    ) {
      setCustomError(
        `Ingresá una cantidad entera entre ${MIN_CUSTOM_CREDITS} y ${MAX_CUSTOM_CREDITS} mensajes.`,
      );
      return;
    }

    try {
      const result = await creditCheckoutMutation.mutateAsync(credits);
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
      } else {
        toast.error(
          "No se pudo conectar con Mercado Pago. Intentá nuevamente.",
        );
      }
    } catch (error) {
      console.error("Error iniciando compra de créditos:", error);
      setFeedbackBanner({
        kind: "error",
        message:
          "No pudimos iniciar el pago con Mercado Pago. Intentá nuevamente.",
      });
      toast.error("No se pudo iniciar la compra de créditos.");
    }
  }

  async function handleSettlePostpaid() {
    setFeedbackBanner(null);
    try {
      const result = await settleCheckoutMutation.mutateAsync();
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
      } else {
        toast.error(
          "No se pudo conectar con Mercado Pago. Intentá nuevamente.",
        );
      }
    } catch (error) {
      console.error("Error iniciando liquidación mes vencido:", error);
      setFeedbackBanner({
        kind: "error",
        message:
          "No pudimos generar el enlace de pago para tu saldo a mes vencido. Intentá nuevamente.",
      });
      toast.error("No se pudo iniciar el pago del consumo acumulado.");
    }
  }

  return (
    <section className="grid grid-cols-1 gap-6 min-w-0">
      <header className="bg-gradient-to-b from-primary/[0.06] to-transparent bg-card border border-border rounded-xl p-6 max-sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
              Notificaciones por WhatsApp
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Créditos y Consumo de WhatsApp
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Todas las herramientas de SabTurno (efectivo, tarjeta de fidelidad,
              múltiples profesionales y plantillas mensuales) están{" "}
              <strong className="text-foreground">100% incluidas gratis</strong>.
              Solo abonás los mensajes de WhatsApp enviados a{" "}
              <strong className="text-foreground">
                {formatCurrency(unitPriceArs)} por mensaje
              </strong>
              .
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary">
            <MessageSquare className="size-4 shrink-0" />
            <span>{formatCurrency(unitPriceArs)} ARS / mensaje enviado</span>
          </div>
        </div>
      </header>

      {feedbackBanner && (
        <div
          role={feedbackBanner.kind === "error" ? "alert" : "status"}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm flex items-start gap-3",
            feedbackBanner.kind === "success" &&
              "border-primary/40 bg-primary/10 text-foreground",
            feedbackBanner.kind === "info" &&
              "border-info/40 bg-info/10 text-foreground",
            feedbackBanner.kind === "error" &&
              "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-primary" />
          <span className="min-w-0">{feedbackBanner.message}</span>
        </div>
      )}

      {walletError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex flex-wrap items-center justify-between gap-3"
        >
          <span>No pudimos cargar el estado de tus créditos de WhatsApp.</span>
          <Button variant="ghost" onClick={() => refetchWallet()}>
            Reintentar
          </Button>
        </div>
      )}

      {billingBlocked && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm">
                Envíos de WhatsApp pausados por saldo vencido
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tus clientes siguen reservando y recibiendo confirmaciones por
                email normalmente. Aboná tu saldo pendiente para reactivar los
                recordatorios y avisos por WhatsApp al instante.
              </p>
            </div>
          </div>
          {postpaidUsed > 0 && (
            <Button
              onClick={handleSettlePostpaid}
              disabled={settleCheckoutMutation.isPending}
              className="shrink-0"
            >
              {settleCheckoutMutation.isPending
                ? "Conectando..."
                : `Abonar ${formatCurrency(postpaidAmountArs)}`}
            </Button>
          )}
        </div>
      )}

      {/* Tarjetas de estado de billetera */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Créditos disponibles
              </span>
              <Coins className="size-5 text-primary shrink-0" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {prepaidCredits}{" "}
              <span className="text-base font-normal text-muted-foreground">
                mensajes
              </span>
            </p>
          </div>
          {totalPurchasedArs === 0 && prepaidCredits > 0 ? (
            <p className="text-xs text-primary flex items-center gap-1.5">
              <Sparkles className="size-3.5 shrink-0" />
              <span>Incluye tus 5 mensajes de bienvenida gratis</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Se descuentan a medida que se envían confirmaciones, recordatorios
              o avisos.
            </p>
          )}
        </article>

        <article className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Consumo a mes vencido
              </span>
              <CreditCard className="size-5 text-primary shrink-0" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(postpaidAmountArs)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {postpaidUsed} {postpaidUsed === 1 ? "mensaje" : "mensajes"}{" "}
              utilizados a mes vencido ({formatCurrency(unitPriceArs)} c/u)
            </p>
          </div>

          {postpaidUsed > 0 || pendingInvoice ? (
            <Button
              onClick={handleSettlePostpaid}
              disabled={settleCheckoutMutation.isPending}
              className="w-full"
            >
              {settleCheckoutMutation.isPending
                ? "Abriendo Mercado Pago..."
                : `Pagar consumo acumulado (${formatCurrency(postpaidAmountArs)})`}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sin saldo pendiente de pago.
            </p>
          )}
        </article>

        <article className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enviados este mes
              </span>
              <MessageSquare className="size-5 text-primary shrink-0" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {currentMonthSentCount}{" "}
              <span className="text-base font-normal text-muted-foreground">
                mensajes
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Si un envío falla definitivamente en WhatsApp, el crédito se
            reintegra automáticamente a tu cuenta.
          </p>
        </article>
      </div>

      {/* Estado de desbloqueo de "A mes vencido" */}
      <article className="rounded-xl border border-border bg-card p-6 max-sm:p-4 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {postpaidUnlocked ? (
              <Unlock className="size-5 text-primary shrink-0" />
            ) : (
              <Lock className="size-5 text-muted-foreground shrink-0" />
            )}
            <h2 className="text-lg font-semibold text-foreground">
              Modalidad a mes vencido
            </h2>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold border",
              postpaidUnlocked
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-border",
            )}
          >
            {postpaidUnlocked ? "Habilitado" : "Modo prepago inicial"}
          </span>
        </div>

        {!postpaidUnlocked ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Incluimos 5 mensajes de bienvenida gratis. Para evitar abusos en
              cuentas nuevas, el pago a mes vencido se habilita automáticamente
              cuando acumules{" "}
              <strong className="text-foreground">
                {formatCurrency(unlockThresholdArs)}
              </strong>{" "}
              en compras de créditos (en uno o varios pagos).
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Acumulado en recargas:{" "}
                  <strong className="text-foreground">
                    {formatCurrency(totalPurchasedArs)}
                  </strong>{" "}
                  de {formatCurrency(unlockThresholdArs)}
                </span>
                <span className="font-semibold text-primary">
                  {unlockProgressPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${unlockProgressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Te faltan{" "}
                <strong className="text-foreground">
                  {formatCurrency(remainingToUnlockArs)}
                </strong>{" "}
                en recargas para habilitar hasta {postpaidLimit} mensajes de
                descubierto mensual.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Si tus créditos prepagos llegan a 0, tus notificaciones de
              WhatsApp siguen saliendo sin interrupciones hasta un descubierto
              de <strong className="text-foreground">{postpaidLimit} mensajes</strong>{" "}
              ({formatCurrency(postpaidLimit * unitPriceArs)}) y podés abonarlos
              a fin de mes.
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Descubierto utilizado:{" "}
                  <strong className="text-foreground">
                    {postpaidUsed} / {postpaidLimit} mensajes
                  </strong>
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(postpaidAmountArs)}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${postpaidUsagePercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Packs de créditos */}
      <article className="rounded-xl border border-border bg-card p-6 max-sm:p-4 space-y-6 min-w-0">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Cargar créditos — {formatCurrency(unitPriceArs)} por mensaje
          </h2>
          <p className="text-sm text-muted-foreground">
            Elegí un pack o ingresá la cantidad de mensajes que quieras sumar.
            Los créditos no tienen vencimiento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACK_PRESETS.map((pack) => {
            const isSelected =
              !isUsingCustom && selectedCredits === pack.credits;
            return (
              <button
                key={pack.credits}
                type="button"
                onClick={() => {
                  setCustomCreditsInput("");
                  setCustomError(null);
                  setSelectedCredits(pack.credits);
                }}
                className={cn(
                  "text-left rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 min-w-0",
                  isSelected
                    ? "border-primary bg-primary/[0.08] shadow-sm"
                    : "border-border bg-muted/30 hover:bg-muted/60",
                )}
              >
                <div className="space-y-1.5">
                  {pack.badge && (
                    <span className="inline-block rounded-md bg-primary/20 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
                      {pack.badge}
                    </span>
                  )}
                  <p className="text-lg font-bold text-foreground">
                    {pack.credits} mensajes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pack.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/60 flex items-baseline justify-between gap-2">
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(pack.credits * unitPriceArs)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(unitPriceArs)} c/u
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="w-full sm:max-w-xs">
            <label
              htmlFor="custom-credits-input"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              O ingresá otra cantidad (mínimo {MIN_CUSTOM_CREDITS} mensajes)
            </label>
            <input
              id="custom-credits-input"
              type="number"
              min={MIN_CUSTOM_CREDITS}
              max={MAX_CUSTOM_CREDITS}
              step={10}
              value={customCreditsInput}
              onChange={(e) => {
                setCustomCreditsInput(e.target.value);
                setCustomError(null);
              }}
              placeholder="Ej: 100"
              className="h-11 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {customError && (
              <p role="alert" className="text-xs text-destructive mt-1.5">
                {customError}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="text-sm text-muted-foreground">
              Total a abonar por{" "}
              <strong className="text-foreground">
                {Number.isFinite(effectiveCreditsToBuy) &&
                effectiveCreditsToBuy > 0
                  ? effectiveCreditsToBuy
                  : 0}{" "}
                mensajes
              </strong>
              :{" "}
              <strong className="text-lg text-primary">
                {formatCurrency(effectiveTotalArs)}
              </strong>
            </div>
            <Button
              onClick={handleBuyCredits}
              disabled={creditCheckoutMutation.isPending}
              className="w-full sm:w-auto"
            >
              {creditCheckoutMutation.isPending
                ? "Redirigiendo a Mercado Pago..."
                : `Comprar ${
                    Number.isFinite(effectiveCreditsToBuy) &&
                    effectiveCreditsToBuy > 0
                      ? effectiveCreditsToBuy
                      : ""
                  } créditos con Mercado Pago`}
            </Button>
          </div>
        </div>

        {postpaidUsed > 0 && (
          <p className="text-xs text-muted-foreground">
            Nota: como actualmente tenés {postpaidUsed} mensajes de consumo a
            mes vencido, cualquier compra de créditos cubrirá primero ese saldo
            y dejará el resto disponible a tu favor.
          </p>
        )}
      </article>

      {/* Historial de movimientos */}
      <article className="rounded-xl border border-border bg-card p-6 max-sm:p-4 space-y-4 min-w-0">
        <div className="flex items-center gap-2">
          <History className="size-5 text-primary shrink-0" />
          <h2 className="text-lg font-semibold text-foreground">
            Últimos movimientos
          </h2>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            Todavía no hay movimientos registrados. Contás con tus 5 mensajes de
            bienvenida listos para usar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {recentTransactions.map((tx) => {
              const meta =
                TRANSACTION_TYPE_META[tx.type] ??
                TRANSACTION_TYPE_META.MANUAL_ADJUSTMENT;
              const isPositive = tx.creditsDelta > 0;
              return (
                <div
                  key={tx.id}
                  className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3 min-w-0"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[0.7rem] font-semibold border",
                          meta.badgeClass,
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className="text-sm font-medium text-foreground break-words">
                        {tx.description || meta.label}
                      </span>
                    </div>
                    {tx.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatLocalDate(tx.createdAt)}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        isPositive ? "text-primary" : "text-foreground",
                      )}
                    >
                      {isPositive ? `+${tx.creditsDelta}` : tx.creditsDelta}{" "}
                      {Math.abs(tx.creditsDelta) === 1 ? "crédito" : "créditos"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: {tx.balanceAfter}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {/* Banner para suscriptores legacy con renovación activa */}
      {premiumStatus?.autoRenew && (
        <article className="rounded-xl border border-border bg-muted/30 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              ¿Tenés una suscripción mensual anterior activa?
            </p>
            <p className="text-xs text-muted-foreground">
              Todas las funciones del sistema ahora son gratuitas. Podés
              administrar o dar de baja tu suscripción anterior desde acá.
            </p>
          </div>
          <Link href="/local/premium/manage">
            <Button variant="secondary">Gestionar suscripción anterior</Button>
          </Link>
        </article>
      )}
    </section>
  );
}
