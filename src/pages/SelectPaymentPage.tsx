import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { PaymentMethod } from "@/lib/types/booking";

export function SelectPaymentPage() {
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
  const [error, setError] = useState<string | null>(null);

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

    setError(null);

    try {
      const createdAppointment = await bookAppointment();
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

      window.alert("Tu turno fue reservado correctamente.");
      navigate("/appointments", { replace: true });
    } catch (caughtError: any) {
      setError(caughtError?.response?.data?.message || caughtError?.message || "No se pudo reservar el turno");
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
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Reserva paso 4</p>
          <h2>Metodo de pago</h2>
          <p>Selecciona como quieres confirmar tu turno.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/booking/appointment")}>Volver</Button>
      </header>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        {methods.map((item) => (
          <button
            key={item.method}
            className={`border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 grid gap-4 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45 cursor-pointer text-left ${paymentMethod === item.method ? "border-[#00f068]/58 bg-[#00f068]/12" : ""}`}
            onClick={() => setPaymentMethod(item.method)}
            type="button"
          >
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </button>
        ))}
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

      {error ? <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">{error}</div> : null}

      <Button onClick={handleConfirm} disabled={!paymentMethod || isLoading}>
        {isLoading ? "Confirmando reserva..." : "Confirmar turno"}
      </Button>
    </section>
  );
}