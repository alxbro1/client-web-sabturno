import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { PaymentMethod } from "@/lib/types/booking";
import iconMercadoPago from "@/assets/payment-methods/mercado_pago.png";
import iconReserved from "@/assets/payment-methods/reserved.png";
import iconCash from "@/assets/payment-methods/cash-in-front.png";

const PAYMENT_METHOD_ICONS: Partial<Record<PaymentMethod, string>> = {
  [PaymentMethod.MERCADO_PAGO]: iconMercadoPago,
  [PaymentMethod.RESERVATION_PAYMENT]: iconReserved,
  [PaymentMethod.CASH_IN_FRONT]: iconCash,
};


export function SelectPaymentPage() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const hasValidEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const hasPhoneNumber = phoneNumber.trim().length > 0;
  const hasGuestContact = hasValidEmail || hasPhoneNumber;
  const navigate = useNavigate();
  const {
    local,
    service,
    selectedDate,
    selectedTime,
    paymentMethod,
    setPaymentMethod,
    bookAppointment,
    isLoading,
  } = useBookingFlow();

  useEffect(() => {
    if (!local) {
      navigate("/booking/select-local", { replace: true });
      return;
    }

    if (!service || !selectedDate || !selectedTime) {
      navigate("/booking/appointment", { replace: true });
    }
  }, [local, navigate, selectedDate, selectedTime, service]);

  const methods = useMemo(() => {
    if (!local || !service) {
      return [];
    }

    const items = [] as { method: PaymentMethod; title: string; description: string }[];

    if (local.mercadoPagoLiveMode) {
      items.push({
        method: PaymentMethod.MERCADO_PAGO,
        title: "Mercado Pago",
        description: "Paga el servicio completo desde la web.",
      });
    }

    if (local.payWithReservation && Number(local.reservationPercentage || 0) >= 10 && Number(local.reservationPercentage || 0) <= 60) {
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
  }, [local, service]);

  async function handleConfirm() {
    if (!paymentMethod) {
      return;
    }

    // Validar email si no loggeado
    if (!user) {
      setEmailTouched(true);
      if (!hasGuestContact) {
        return;
      }
    }

    try {
      const phoneNumberString = hasPhoneNumber
        ? `54${phoneNumber.replace(/^\+?0?/, "").replace(/\s/g, "").replace(/-/g, "")}`
        : undefined;

      const createdAppointment = await bookAppointment({
        email: user ? user.email : email,
        userName: user ? user.name : userName,
        phoneNumber: user ? user.phone : phoneNumberString,
      });
      const externalReference = createdAppointment.mercadoPago?.externalReference;
      const checkoutUrl = createdAppointment.mercadoPago?.initPoint || createdAppointment.mercadoPago?.sandboxInitPoint;

      if (
        (paymentMethod === PaymentMethod.MERCADO_PAGO || paymentMethod === PaymentMethod.RESERVATION_PAYMENT) &&
        checkoutUrl &&
        externalReference
      ) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
        navigate(`/booking/payment-status?externalReference=${encodeURIComponent(externalReference)}&result=pending`, { replace: true });
        return;
      }

      // Si el usuario no está loggeado, mostrar link seguro
      if (!user && createdAppointment.accessHash) {
        const publicLink = `${window.location.origin}/appointment/${createdAppointment.id}?hash=${createdAppointment.accessHash}`;
        const msg = encodeURIComponent(`¡Tu turno fue reservado correctamente!\n\nPuedes acceder a los detalles y gestionar tu turno usando este link seguro:\n${publicLink}\n\nTambién te enviamos los detalles a tu email o whatsapp.`);
        navigate(`/booking/result?status=success&message=${msg}`, { replace: true });
        return;
      }

      navigate("/booking/result?status=success&message=Tu%20turno%20fue%20reservado%20correctamente.%20Te%20enviamos%20los%20detalles%20a%20tu%20email%20o%20whatsapp.", { replace: true });
    } catch (caughtError: any) {
      const errorMessage = caughtError?.response?.data?.message || caughtError?.message || "No se pudo reservar el turno";
      navigate(`/booking/result?status=error&message=${encodeURIComponent(errorMessage)}`, { replace: true });
    }
  }

  if (!local || !service) {
    return null;
  }

  const reservationPercentage = Number(local.reservationPercentage || 0);
  const serviceCost = Number(service.cost || 0);
  const reservationAmount = serviceCost * (reservationPercentage / 100);
  const marketplaceFee = serviceCost * 0.03;

  return (
    <section className="grid gap-6 p-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Reserva paso 4</p>
          <h2>Metodo de pago</h2>
          <p>Selecciona como quieres confirmar tu turno.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/booking/appointment")}>Volver</Button>
      </header>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        {methods.map((item) => {
          const isActive = paymentMethod === item.method;
          return (
            <button
              key={item.method}
              className={`relative rounded-[28px] p-5 flex items-center gap-4 cursor-pointer text-left transition-[transform,border-color,background-color,box-shadow] duration-[140ms] ${
                isActive
                  ? "border border-[#00f068]/70 bg-[radial-gradient(circle_at_0%_0%,rgba(0,240,104,0.14),transparent_60%),linear-gradient(180deg,rgba(22,22,22,0.98),rgba(12,12,12,0.96))] shadow-[0_0_0_1px_rgba(0,240,104,0.22),0_20px_50px_rgba(0,240,104,0.08)]"
                  : "border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] hover:-translate-y-0.5 hover:border-[#00f068]/45"
              }`}
              onClick={() => setPaymentMethod(item.method)}
              type="button"
            >
              {isActive ? (
                <span className="absolute top-4 right-4 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#00f068]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#07150d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
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
                <h3 className={isActive ? "text-[#00f068]" : ""}>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {paymentMethod === PaymentMethod.RESERVATION_PAYMENT ? (
        <div className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 grid gap-[0.85rem]">
          <h3>Detalle de reserva parcial</h3>
          <p>
            Reserva: ${reservationAmount.toFixed(2)}. Fee app: ${marketplaceFee.toFixed(2)}. Resto en el local: ${
              (serviceCost - reservationAmount).toFixed(2)
            }.
          </p>
        </div>
      ) : null}

      {paymentMethod === PaymentMethod.MERCADO_PAGO ? (
        <div className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 grid gap-[0.85rem]">
          <h3>Detalle de pago online</h3>
          <p>
            Servicio: ${serviceCost.toFixed(2)}. Fee app: ${marketplaceFee.toFixed(2)}.
          </p>
          <p className="text-white/68">
            El fee se informa en el checkout de Mercado Pago al confirmar el pago.
          </p>
        </div>
      ) : null}

      {/* Formulario de email/nombre/telefono si no loggeado */}
      {!user && (
        <div className="border border-white/12 m-4 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 grid gap-[0.85rem]">
          <h3>Datos de contacto</h3>
          <label className="block text-sm font-semibold mt-3 mb-0 pb-0">Teléfono (WhatsApp) (opcional si completas email)</label>
          <label className="block text-xs mb-1 mt-0 pt-0">Completa al menos uno: email o teléfono. Te enviaremos la confirmación por email y/o WhatsApp según el dato que ingreses.</label>
          <input
            className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
            type="tel"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            placeholder="Ej: 1123456789"
          />
          <label className="block text-sm font-semibold mb-1">Email (opcional si completas teléfono)</label>
          <input
            className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="tu@email.com"
          />
          {emailTouched && email.trim().length > 0 && !hasValidEmail && !hasPhoneNumber && (
            <span className="text-[#ff5678] text-xs">Ingresa un email válido o completa tu teléfono</span>
          )}
          <label className="block text-sm font-semibold mb-1 mt-3">Nombre (opcional)</label>
          <input
            className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
      )}

      <Button onClick={handleConfirm} disabled={!paymentMethod || isLoading || (!user && !hasGuestContact)}>
        {isLoading ? "Confirmando reserva..." : "Confirmar turno"}
      </Button>
    </section>
  );
}

export interface CreateAppointmentResponse {
  id: string;
  // ...other properties...
  accessHash?: string; // <-- Add this line
  // ...other properties...
}