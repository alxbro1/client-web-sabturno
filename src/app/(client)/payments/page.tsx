"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { usePaymentsQuery } from "@/hooks/queries/usePaymentsQuery";
import { formatLocalDate } from "@/lib/utils/date";
import type { UserPayment } from "@/lib/types/user";

const STATUS_LABEL: Record<UserPayment["status"], string> = {
  COMPLETED: "Completado",
  PENDING: "Pendiente",
  FAILED: "Fallido",
};

const STATUS_CLASS: Record<UserPayment["status"], string> = {
  COMPLETED: "text-[#86efac]",
  PENDING: "text-[#fde68a]",
  FAILED: "text-[#fca5a5]",
};

export default function PaymentsPage() {
  const { data: payments = [], isLoading, error, refetch } = usePaymentsQuery();

  const totalSpent = useMemo(
    () =>
      payments.reduce(
        (accumulator, payment) => accumulator + Number(payment.amount || 0),
        0,
      ),
    [payments],
  );

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Pagos
          </p>
          <h2>Mis pagos</h2>
          <p>Total abonado: ${totalSpent.toFixed(2)}</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Actualizar
        </Button>
      </header>

      {isLoading ? (
        <div className="border border-white/10 bg-[#12141a] rounded-2xl p-5 min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
          Cargando pagos...
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {error.message}
        </div>
      ) : null}
      {!isLoading && payments.length === 0 ? (
        <div className="border border-white/10 bg-[#12141a] rounded-2xl p-5 min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
          Todavia no tienes pagos registrados.
        </div>
      ) : null}

      <div className="grid gap-[0.85rem] [contain:layout_style]">
        {payments.map((payment) => (
          <article
            key={payment.id}
            className="border border-white/10 bg-[#12141a] rounded-2xl p-5 grid gap-4 [content-visibility:auto] [contain:layout_paint_style] [contain-intrinsic-size:240px]"
          >
            <div className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-start">
              <div>
                <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
                  {payment.method || "Pago"}
                </p>
                <h3>${Number(payment.amount || 0).toFixed(2)}</h3>
              </div>
              <span
                className={`inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border border-white/20 bg-black/35 text-sm ${STATUS_CLASS[payment.status]}`}
              >
                {STATUS_LABEL[payment.status]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div>
                <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">
                  Servicio
                </span>
                <strong>
                  {payment.appointment?.service?.name || "Sin servicio"}
                </strong>
              </div>
              <div>
                <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">
                  Local
                </span>
                <strong>
                  {payment.appointment?.local?.name || "Sin local"}
                </strong>
              </div>
              <div>
                <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">
                  Turno
                </span>
                <strong>
                  {payment.appointment?.startDateTime
                    ? formatLocalDate(
                        payment.appointment.startDateTime,
                        undefined,
                        "dd/MM/yyyy HH:mm",
                      )
                    : "Sin fecha"}
                </strong>
              </div>
              <div>
                <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">
                  Referencia
                </span>
                <strong>
                  {payment.mercadoPagoExternalReference || "Sin referencia"}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
