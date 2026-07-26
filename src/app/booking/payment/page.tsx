"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/ui/card";
import { useTaloStatusQuery } from "@/hooks/queries/useTaloStatusQuery";
import { useCreateAppointmentMutation } from "@/hooks/mutations/useCreateAppointmentMutation";
import { useAuth } from "@/hooks/useAuth";
import { useBookingStore } from "@/stores/booking";
import { PaymentMethod } from "@/lib/types/booking";
import { queryKeys } from "@/lib/queryKeys";
import { loyaltyService } from "@/services/loyalty";
import type { LoyaltyReward } from "@/lib/types/loyalty";
import { DEFAULT_TIMEZONE } from "@/lib/constants/countries";
import { convertLocalToUTC, formatDateOnlyLocal } from "@/lib/utils/date";
import iconMercadoPago from "@/assets/payment-methods/mercado_pago.png";
import iconReserved from "@/assets/payment-methods/reserved.png";
import iconCash from "@/assets/payment-methods/cash-in-front.png";

const PAYMENT_METHOD_ICONS: Partial<Record<PaymentMethod, string>> = {
  [PaymentMethod.MERCADO_PAGO]: iconMercadoPago.src,
  [PaymentMethod.RESERVATION_PAYMENT]: iconReserved.src,
  [PaymentMethod.CASH_IN_FRONT]: iconCash.src,
};

export default function SelectPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const local = useBookingStore((s) => s.local);
  const service = useBookingStore((s) => s.service);
  const storedDate = useBookingStore((s) => s.date);
  const storedTime = useBookingStore((s) => s.time);
  const paymentMethod = useBookingStore((s) => s.paymentMethod);
  const loyaltyRewardId = useBookingStore((s) => s.loyaltyRewardId);
  const loyaltyCouponCode = useBookingStore((s) => s.loyaltyCouponCode);
  const setPaymentMethod = useBookingStore((s) => s.setPaymentMethod);
  const setLoyaltyRewardId = useBookingStore((s) => s.setLoyaltyRewardId);
  const setLoyaltyCouponCode = useBookingStore((s) => s.setLoyaltyCouponCode);

  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");

  const { data: taloStatus } = useTaloStatusQuery(local?.id);
  const createAppointment = useCreateAppointmentMutation();

  const taloEnabled = taloStatus?.connected ?? false;

  const isGuestEmailMissing = !user && !email.trim();
  const { data: loyaltyRewards = [] } = useQuery({
    queryKey: queryKeys.loyaltyBookingRewards(
      local?.id || "",
      service?.id || 0,
      user?.id,
    ),
    queryFn: () =>
      loyaltyService.getBookingRewards({
        localId: local!.id,
        serviceId: service!.id,
      }),
    enabled: !!local?.id && !!service?.id && !!user?.id,
  });

  const normalizedCouponCode = loyaltyCouponCode.trim().toLowerCase();
  const hasCompleteCouponCode =
    normalizedCouponCode.length === 16 || normalizedCouponCode.length === 32;
  const { data: couponValidation, isFetching: isValidatingCoupon } = useQuery({
    queryKey: [
      "loyalty",
      "coupon",
      local?.id,
      service?.id,
      normalizedCouponCode,
    ],
    queryFn: () =>
      loyaltyService.validateBookingCoupon({
        localId: local!.id,
        serviceId: service!.id,
        code: normalizedCouponCode,
      }),
    enabled:
      !user &&
      !!local?.id &&
      !!service?.id &&
      hasCompleteCouponCode,
    retry: false,
  });

  const methods = useMemo(() => {
    if (!local || !service) return [];

    const items: { method: PaymentMethod; title: string; description: string }[] = [];

    if (local.payWithTalo && taloEnabled) {
      items.push({
        method: PaymentMethod.TALO,
        title: "Transferencia bancaria (Talo)",
        description: "Paga con cualquier banco argentino. Sin costo adicional.",
      });
    }

    if (local.mercadoPagoLiveMode) {
      items.push({
        method: PaymentMethod.MERCADO_PAGO,
        title: "Mercado Pago",
        description: "Paga el servicio completo desde la web.",
      });
    }

    if (
      local.payWithReservation &&
      Number(local.reservationPercentage || 0) >= 10 &&
      Number(local.reservationPercentage || 0) <= 60
    ) {
      items.push({
        method: PaymentMethod.RESERVATION_PAYMENT,
        title: "Reserva parcial",
        description: `Abonas ${Number(local.reservationPercentage || 0)}% ahora y el resto en el local.`,
      });
    }

    if (local.payWithCashInFront) {
      items.push({
        method: PaymentMethod.CASH_IN_FRONT,
        title: "Efectivo en el local",
        description: "Confirmas la reserva y pagas presencialmente.",
      });
    }

    return items;
  }, [local, service, taloEnabled]);

  useEffect(() => {
    if (!local) {
      router.replace("/booking/select-local");
      return;
    }

    if (!service || !storedDate || !storedTime) {
      router.replace("/booking/appointment");
    }

    if (methods.length === 1) {
      setPaymentMethod(methods[0].method);
    }
  }, [local, router, storedDate, storedTime, service, methods.length, setPaymentMethod]);

  async function handleConfirm() {
    const couponMakesServiceFree =
      !user && couponValidation?.valid === true && couponValidation.finalAmount === 0;
    const effectivePaymentMethod = paymentMethod || methods[0]?.method;
    if ((!effectivePaymentMethod && !couponMakesServiceFree) || isGuestEmailMissing) return;

    try {
      const timezone = user?.timezone || local?.timezone || DEFAULT_TIMEZONE;
      const [hours, minutes] = storedTime!.split(":").map(Number);
      const [year, month, day] = storedDate!.split("-").map(Number);
      const localDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

      const appointmentData = {
        startDateTime: convertLocalToUTC(localDateTime, timezone),
        serviceId: service!.id,
        countryCode: user?.countryCode || local?.countryCode,
        timezone,
        paymentMethod: effectivePaymentMethod || PaymentMethod.CASH_IN_FRONT,
        email: user?.email || email,
        userName: user?.name || userName,
        phoneNumber: user?.phone,
        checkoutReturnUrl: `${window.location.origin}/booking/payment-status`,
        ...(user?.id ? { userId: user.id } : {}),
        ...(loyaltyRewardId ? { loyaltyRewardId } : {}),
        ...(!user && couponValidation?.valid && normalizedCouponCode
          ? { loyaltyCouponCode: normalizedCouponCode }
          : {}),
      };

      const createdAppointment = await createAppointment.mutateAsync(appointmentData);
      const externalReference = createdAppointment.mercadoPago?.externalReference;
      const checkoutUrl =
        createdAppointment.mercadoPago?.initPoint ||
        createdAppointment.mercadoPago?.sandboxInitPoint;

      if (
        (paymentMethod === PaymentMethod.MERCADO_PAGO ||
          paymentMethod === PaymentMethod.RESERVATION_PAYMENT) &&
        checkoutUrl &&
        externalReference
      ) {
        window.location.assign(checkoutUrl);
        return;
      }

      if (paymentMethod === PaymentMethod.TALO && createdAppointment.talo?.paymentUrl) {
        window.location.href = createdAppointment.talo.paymentUrl;
        return;
      }

      if (!user && createdAppointment.accessHash) {
        const publicLink = `${window.location.origin}/appointment/${createdAppointment.id}?hash=${createdAppointment.accessHash}`;
        const msg = encodeURIComponent(
          `Tu turno fue reservado correctamente!\n\nPuedes acceder a los detalles y gestionar tu turno usando este link seguro:\n${publicLink}\n\nTambien te enviamos los detalles a tu email o whatsapp.`,
        );
        router.replace(`/booking/result?status=success&message=${msg}`);
        return;
      }

      router.replace(
        "/booking/result?status=success&message=Tu%20turno%20fue%20reservado%20correctamente.%20Te%20enviamos%20los%20detalles%20a%20tu%20email%20o%20whatsapp.",
      );
    } catch (caughtError: unknown) {
      const err = caughtError as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo reservar el turno";
      router.replace(
        `/booking/result?status=error&message=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  if (!local || !service) return null;

  const reservationPercentage = Number(local.reservationPercentage || 0);
  const serviceCost = Number(service.cost || 0);
  const selectedReward = loyaltyRewards.find((reward) => reward.id === loyaltyRewardId);
  const loyaltyDiscount =
    !user && couponValidation?.valid
      ? couponValidation.discountAmount
      : selectedReward
        ? calculateRewardDiscount(serviceCost, selectedReward)
        : 0;
  const finalServiceCost = Math.max(0, serviceCost - loyaltyDiscount);
  const isFullyDiscounted = finalServiceCost === 0 && loyaltyDiscount > 0;
  const reservationAmount = finalServiceCost * (reservationPercentage / 100);
  const marketplaceFee = finalServiceCost * 0.03;

  const methodCardBase =
    "relative rounded-xl p-5 flex items-center gap-4 cursor-pointer text-left transition-all duration-[140ms]";
  const methodCardInactive =
    "border border-border bg-card shadow-sm hover:-translate-y-0.5 hover:border-primary/40";
  const methodCardActive =
    "border-2 border-primary/60 bg-primary/[0.06] shadow-sm";

  return (
    <section className="flex flex-col gap-6 p-8 min-h-screen items-center">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch w-full">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Reserva paso 4
          </p>
          <h2 className="text-2xl font-bold text-foreground">Metodo de pago</h2>
          <p className="text-muted-foreground">Selecciona un metodo de pago.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push("/booking/appointment")}
        >
          Volver
        </Button>
      </header>

      {isFullyDiscounted ? (
        <Card className="w-full border-[#00f068]/40 bg-[#00f068]/10 p-5">
          <h3 className="font-semibold text-foreground">Tu turno queda cubierto</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No necesitás elegir un medio de pago. El turno se confirmará al reservar.
          </p>
        </Card>
      ) : (
      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1 w-full">
        {methods.map((item) => {
          const isActive = paymentMethod === item.method;
          return (
            <button
              key={item.method}
              className={`${methodCardBase} ${isActive ? methodCardActive : methodCardInactive}`}
              onClick={() => setPaymentMethod(item.method)}
              type="button"
            >
              {isActive ? (
                <span className="absolute top-4 right-4 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </span>
              ) : null}
              {PAYMENT_METHOD_ICONS[item.method] ? (
                <img
                  src={PAYMENT_METHOD_ICONS[item.method]}
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-10 shrink-0 object-contain"
                />
              ) : null}
              <div>
                <h3 className={`font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      )}

      {!user ? (
        <Card className="w-full p-5 grid gap-3">
          <div>
            <h3 className="font-semibold text-foreground">¿Tenés un cupón?</h3>
            <p className="text-sm text-muted-foreground">
              Ingresá el código que recibiste por correo.
            </p>
          </div>
          <input
            value={loyaltyCouponCode}
            onChange={(event) =>
              setLoyaltyCouponCode(event.target.value.toUpperCase().replace(/\s/g, ""))
            }
            placeholder="Ej. A1B2C3D4E5F6"
            autoComplete="off"
            className="h-11 rounded-lg border border-input bg-background px-3 font-mono uppercase tracking-wider"
          />
          {isValidatingCoupon ? (
            <p className="text-sm text-muted-foreground">Validando cupón...</p>
          ) : normalizedCouponCode && !hasCompleteCouponCode ? (
            <p className="text-sm text-destructive">
              Revisá el código: está incompleto o tiene un formato inválido.
            </p>
          ) : couponValidation?.valid ? (
            <div className="rounded-lg border border-[#00f068]/30 bg-[#00f068]/10 p-3 text-sm">
              <p className="font-semibold text-[#00b94f]">Cupón válido</p>
              <p className="text-muted-foreground">
                {couponValidation.benefit}. Ahorrás ${couponValidation.discountAmount.toFixed(2)}.
              </p>
            </div>
          ) : couponValidation ? (
            <p className="text-sm text-destructive">
              {couponErrorLabel(couponValidation.reason)}
            </p>
          ) : null}
        </Card>
      ) : null}

      {user && loyaltyRewards.length > 0 ? (
        <Card className="w-full p-5 grid gap-3">
          <h3 className="font-semibold text-foreground">Usar recompensa</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setLoyaltyRewardId(null)}
              className={`rounded-lg border p-3 text-left text-sm ${
                !loyaltyRewardId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              No usar recompensa
            </button>
            {loyaltyRewards.map((reward) => (
              <button
                key={reward.id}
                type="button"
                onClick={() => setLoyaltyRewardId(reward.id)}
                className={`rounded-lg border p-3 text-left text-sm ${
                  loyaltyRewardId === reward.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                <span className="block font-semibold text-foreground">
                  {rewardLabel(reward)}
                </span>
                {reward.expiresAt ? (
                  <span>Vence {new Date(reward.expiresAt).toLocaleDateString("es-AR")}</span>
                ) : null}
              </button>
            ))}
          </div>
          {selectedReward ? (
            <p className="text-sm text-muted-foreground">
              Descuento estimado: ${loyaltyDiscount.toFixed(2)}. Total servicio: $
              {finalServiceCost.toFixed(2)}.
            </p>
          ) : null}
        </Card>
      ) : null}

      {!isFullyDiscounted && paymentMethod === PaymentMethod.RESERVATION_PAYMENT ? (
        <Card className="w-full p-5 grid gap-3">
          <h3 className="font-semibold text-foreground">Detalle de reserva parcial</h3>
          <p className="text-sm text-muted-foreground">
            Reserva: ${reservationAmount.toFixed(2)}. Fee app: $
            {marketplaceFee.toFixed(2)}. Resto en el local: $
            {(finalServiceCost - reservationAmount).toFixed(2)}.
          </p>
        </Card>
      ) : null}

      {!isFullyDiscounted &&
      (paymentMethod === PaymentMethod.MERCADO_PAGO ||
        paymentMethod === PaymentMethod.TALO) ? (
        <Card className="w-full p-5 grid gap-3">
          <h3 className="font-semibold text-foreground">Detalle de pago online</h3>
          <p className="text-sm text-muted-foreground">
            Servicio: ${finalServiceCost.toFixed(2)}. Fee app: $
            {marketplaceFee.toFixed(2)}.
          </p>
          {paymentMethod === PaymentMethod.MERCADO_PAGO && (
            <p className="text-sm text-muted-foreground">
              El fee se informa en el checkout de Mercado Pago al confirmar el
              pago.
            </p>
          )}
        </Card>
      ) : null}

      {!user && (
        <Card className="w-full p-5 grid gap-3">
          <h3 className="font-semibold text-foreground">Datos de contacto</h3>
          <label className="text-sm font-medium text-foreground">
            Email (si quieres que te lleguen las notificaciones)
          </label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
          {isGuestEmailMissing ? (
            <p className="text-sm text-destructive">
              Falta completar un campo obligatorio: email.
            </p>
          ) : null}
          <label className="text-sm font-medium text-foreground mt-1">
            Nombre
          </label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Tu nombre"
          />
        </Card>
      )}

      <Button
        onClick={handleConfirm}
        disabled={
          (!paymentMethod && !isFullyDiscounted) ||
          createAppointment.isPending ||
          isGuestEmailMissing ||
          isValidatingCoupon
        }
        className="mt-6 max-w-sm self-center bg-[#00f068] text-black hover:bg-[#00f068]/90 focus:ring-[#00f068]/50"
      >
        {createAppointment.isPending ? "Confirmando reserva..." : "Confirmar turno"}
      </Button>
    </section>
  );
}

function rewardLabel(reward: LoyaltyReward) {
  if (reward.type === "FREE_SERVICE") return "Servicio gratis";
  if (reward.type === "PERCENTAGE_DISCOUNT") return `${Number(reward.value || 0)}% de descuento`;
  return `$${Number(reward.value || 0).toFixed(2)} de descuento`;
}

function calculateRewardDiscount(serviceCost: number, reward: LoyaltyReward) {
  if (reward.type === "FREE_SERVICE") return serviceCost;
  if (reward.type === "PERCENTAGE_DISCOUNT") {
    return serviceCost * (Math.min(100, Math.max(0, Number(reward.value || 0))) / 100);
  }
  return Math.min(serviceCost, Number(reward.value || 0));
}

function couponErrorLabel(
  reason: "NOT_FOUND" | "UNAVAILABLE" | "EXPIRED" | "INCOMPATIBLE_SERVICE",
) {
  if (reason === "EXPIRED") return "Este cupón está vencido.";
  if (reason === "UNAVAILABLE") return "Este cupón ya fue usado o está reservado.";
  if (reason === "INCOMPATIBLE_SERVICE") {
    return "Este cupón no aplica al servicio seleccionado.";
  }
  return "No encontramos un cupón válido con ese código.";
}
