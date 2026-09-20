"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/ui/card";
import { BookingSummary } from "@/components/booking/BookingSummary";
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

type ContactChannel = "whatsapp" | "email";

const CONTACT_CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "email", label: "Email", icon: Mail },
] as const satisfies ReadonlyArray<{
  value: ContactChannel;
  label: string;
  icon: typeof Mail;
}>;

export default function SelectPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const local = useBookingStore((s) => s.local);
  const service = useBookingStore((s) => s.service);
  const storedDate = useBookingStore((s) => s.date);
  const storedTime = useBookingStore((s) => s.time);
  const phoneNumber = useBookingStore((s) => s.phoneNumber);
  const paymentMethod = useBookingStore((s) => s.paymentMethod);
  const loyaltyRewardId = useBookingStore((s) => s.loyaltyRewardId);
  const loyaltyCouponCode = useBookingStore((s) => s.loyaltyCouponCode);
  const setPaymentMethod = useBookingStore((s) => s.setPaymentMethod);
  const setLoyaltyRewardId = useBookingStore((s) => s.setLoyaltyRewardId);
  const setLoyaltyCouponCode = useBookingStore((s) => s.setLoyaltyCouponCode);
  const setPhoneNumber = useBookingStore((s) => s.setPhoneNumber);

  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [contactChannel, setContactChannel] =
    useState<ContactChannel>("whatsapp");

  const { data: taloStatus } = useTaloStatusQuery(local?.id);
  const createAppointment = useCreateAppointmentMutation();

  const taloEnabled = taloStatus?.connected ?? false;

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length >= 10 && phoneDigits.length <= 15;
  const isEmailValid = /\S+@\S+\.\S+/.test(email.trim());

  // Con un canal alcanza. El backend trata email y telefono como alternativas:
  // en create-appointment.dto ambos son @IsOptional(), y la notificacion se
  // dispara con (email || phoneNumber || user.phone), con WhatsApp y mail
  // gateados por separado. Exigir los dos era una restriccion solo del front.
  //
  // El usuario logueado siempre tiene email en su cuenta, asi que su telefono
  // es opcional: se precarga para avisarle por WhatsApp, pero no bloquea.
  const isContactMissing = user
    ? false
    : contactChannel === "whatsapp"
      ? !isPhoneValid
      : !isEmailValid;
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

  useEffect(() => {
    if (!phoneNumber && user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [phoneNumber, setPhoneNumber, user?.phone]);

  async function handleConfirm() {
    const couponMakesServiceFree =
      !user && couponValidation?.valid === true && couponValidation.finalAmount === 0;
    const effectivePaymentMethod = paymentMethod || methods[0]?.method;
    if (
      (!effectivePaymentMethod && !couponMakesServiceFree) ||
      isContactMissing
    ) return;

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
        email: user?.email || (contactChannel === "email" ? email.trim() : ""),
        userName: user?.name || userName,
        phoneNumber:
          user || contactChannel === "whatsapp" ? phoneNumber.trim() : "",
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

  const isConfirmDisabled =
    (!paymentMethod && !isFullyDiscounted) ||
    createAppointment.isPending ||
    isContactMissing ||
    isValidatingCoupon;

  const confirmBlockedReason = createAppointment.isPending
    ? null
    : isValidatingCoupon
      ? "Estamos validando el cupón."
      : !paymentMethod && !isFullyDiscounted
        ? "Elegí un método de pago para continuar."
        : isContactMissing
          ? contactChannel === "whatsapp"
            ? "Ingresá tu WhatsApp para recibir la confirmación."
            : "Ingresá tu email para recibir la confirmación."
          : null;

  const methodCardBase =
    "relative flex cursor-pointer items-center gap-4 rounded-xl border p-5 text-left shadow-sm transition-colors duration-[140ms] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";
  const methodCardInactive =
    "border-border bg-card hover:border-primary/40";
  const methodCardActive = "border-primary bg-primary/15";

  return (
    <section className="flex flex-col items-center gap-6 py-6">
      <div className="w-full">
        <Button
          variant="ghost"
          className="-ml-3 gap-1 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/booking/appointment")}
        >
          <ChevronLeft className="size-4" />
          Cambiar fecha y horario
        </Button>
      </div>

      <header className="w-full">
        <h2 className="text-2xl font-bold text-foreground">Confirmá tu turno</h2>
        <p className="text-muted-foreground">
          Revisá los datos y elegí cómo querés pagar.
        </p>
      </header>

      <BookingSummary discount={loyaltyDiscount} />

      {isFullyDiscounted ? (
        <Card className="w-full border-primary/40 bg-primary/10 p-5">
          <h3 className="font-semibold text-foreground">Tu turno queda cubierto</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No necesitás elegir un medio de pago. El turno se confirmará al reservar.
          </p>
        </Card>
      ) : (
      methods.length === 1 ? (
        <Card className="w-full flex-row items-center gap-4 p-5">
          {PAYMENT_METHOD_ICONS[methods[0].method] ? (
            <img
              src={PAYMENT_METHOD_ICONS[methods[0].method]}
              alt=""
              aria-hidden="true"
              className="h-10 w-10 shrink-0 object-contain"
            />
          ) : null}
          <div>
            <h3 className="font-semibold text-foreground">{methods[0].title}</h3>
            <p className="text-sm text-muted-foreground">
              {methods[0].description}
            </p>
          </div>
        </Card>
      ) : (
      <div className="w-full">
        <h3 className="mb-3 text-lg font-semibold text-foreground">
          Método de pago
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
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
      </div>
      )
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
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
              <p className="font-semibold text-primary">Cupón válido</p>
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

      <Card className="w-full p-5 grid grid-cols-1 gap-3">
        <div>
          <h3 className="font-semibold text-foreground">
            {user ? "Avisos del turno" : "¿Dónde querés la confirmación?"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {user
              ? "Te avisamos por email a tu cuenta. Si dejás tu número, también te escribimos por WhatsApp."
              : "Con un canal alcanza: te mandamos ahí la confirmación y el recordatorio."}
          </p>
        </div>

        {!user ? (
          <fieldset className="grid grid-cols-1 gap-2">
            <legend className="sr-only">Canal de contacto</legend>
            <div className="grid grid-cols-2 gap-2">
              {CONTACT_CHANNELS.map((option) => {
                const isActive = contactChannel === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setContactChannel(option.value)}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-3 text-sm transition-colors duration-150 outline-none cursor-pointer focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                      isActive
                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <option.icon aria-hidden className="size-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {user || contactChannel === "whatsapp" ? (
          <>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="booking-phone"
            >
              {user ? "Teléfono (opcional)" : "Teléfono"}
            </label>
            <input
              id="booking-phone"
              className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="Ej. +54 9 351 123 4567"
              aria-invalid={phoneNumber.length > 0 && !isPhoneValid}
              aria-describedby="booking-phone-help"
            />
            <p
              id="booking-phone-help"
              className={`text-sm ${
                phoneNumber.length > 0 && !isPhoneValid
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {phoneNumber.length > 0 && !isPhoneValid
                ? "Ingresá un teléfono válido de entre 10 y 15 dígitos."
                : "Podés incluir el código de país, por ejemplo +54 9 para Argentina."}
            </p>
          </>
        ) : (
          <>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="booking-email"
            >
              Email
            </label>
            <input
              id="booking-email"
              className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              aria-invalid={email.length > 0 && !isEmailValid}
              aria-describedby="booking-email-help"
            />
            <p
              id="booking-email-help"
              className={`text-sm ${
                email.length > 0 && !isEmailValid
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {email.length > 0 && !isEmailValid
                ? "Revisá el email: parece que le falta algo."
                : "Te mandamos ahí la confirmación y el recordatorio."}
            </p>
          </>
        )}

        {!user ? (
          <>
            <label
              className="mt-1 text-sm font-medium text-foreground"
              htmlFor="booking-name"
            >
              Nombre
            </label>
            <input
              id="booking-name"
              className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
              type="text"
              autoComplete="name"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Tu nombre"
            />
          </>
        ) : null}
      </Card>

      <div className="sticky bottom-0 -mx-4 mt-2 w-[calc(100%+2rem)] border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        {confirmBlockedReason ? (
          <p
            id="booking-confirm-help"
            className="mb-2 text-center text-sm text-muted-foreground"
          >
            {confirmBlockedReason}
          </p>
        ) : null}
        <div className="flex justify-center">
          <Button
            onClick={handleConfirm}
            aria-describedby={confirmBlockedReason ? "booking-confirm-help" : undefined}
            disabled={isConfirmDisabled}
            className="w-full max-w-sm disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
          >
            {createAppointment.isPending ? "Confirmando reserva..." : "Confirmar turno"}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Vas a reservar este turno a tu nombre. Podés cancelarlo desde el
          detalle del turno.
        </p>
      </div>
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
