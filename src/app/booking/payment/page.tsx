"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/ui/card";
import { useTaloStatusQuery } from "@/hooks/queries/useTaloStatusQuery";
import { useCreateAppointmentMutation } from "@/hooks/mutations/useCreateAppointmentMutation";
import { useAuthStore } from "@/stores/auth";
import { useBookingStore } from "@/stores/booking";
import { PaymentMethod } from "@/lib/types/booking";
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
  const { user } = useAuthStore();
  const local = useBookingStore((s) => s.local);
  const service = useBookingStore((s) => s.service);
  const storedDate = useBookingStore((s) => s.date);
  const storedTime = useBookingStore((s) => s.time);
  const paymentMethod = useBookingStore((s) => s.paymentMethod);
  const setPaymentMethod = useBookingStore((s) => s.setPaymentMethod);

  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");

  const { data: taloStatus } = useTaloStatusQuery(local?.id);
  const createAppointment = useCreateAppointmentMutation();

  const taloEnabled = taloStatus?.connected ?? false;

  const isGuestEmailMissing = !user && !email.trim();

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
    if (!paymentMethod || isGuestEmailMissing) return;

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
        paymentMethod: paymentMethod,
        email: user?.email || email,
        userName: user?.name || userName,
        phoneNumber: user?.phone,
        ...(user?.id ? { userId: user.id } : {}),
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
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
        router.replace(
          `/booking/payment-status?externalReference=${encodeURIComponent(externalReference)}&result=pending`,
        );
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
  const reservationAmount = serviceCost * (reservationPercentage / 100);
  const marketplaceFee = serviceCost * 0.03;

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

      {paymentMethod === PaymentMethod.RESERVATION_PAYMENT ? (
        <Card className="w-full p-5 grid gap-3">
          <h3 className="font-semibold text-foreground">Detalle de reserva parcial</h3>
          <p className="text-sm text-muted-foreground">
            Reserva: ${reservationAmount.toFixed(2)}. Fee app: $
            {marketplaceFee.toFixed(2)}. Resto en el local: $
            {(serviceCost - reservationAmount).toFixed(2)}.
          </p>
        </Card>
      ) : null}

      {paymentMethod === PaymentMethod.MERCADO_PAGO ||
      paymentMethod === PaymentMethod.TALO ? (
        <Card className="w-full p-5 grid gap-3">
          <h3 className="font-semibold text-foreground">Detalle de pago online</h3>
          <p className="text-sm text-muted-foreground">
            Servicio: ${serviceCost.toFixed(2)}. Fee app: $
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
        disabled={!paymentMethod || createAppointment.isPending || isGuestEmailMissing}
        className="mt-6 max-w-sm self-center bg-[#00f068] text-black hover:bg-[#00f068]/90 focus:ring-[#00f068]/50"
      >
        {createAppointment.isPending ? "Confirmando reserva..." : "Confirmar turno"}
      </Button>
    </section>
  );
}
