import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { userService } from "@/services/user";
import type { UserPayment } from "@/lib/types/user";

const STATUS_LABEL: Record<UserPayment["status"], string> = {
  COMPLETED: "Completado",
  PENDING: "Pendiente",
  FAILED: "Fallido",
};

export function ProfilePaymentsPage() {
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPayments() {
    try {
      setLoading(true);
      setError(null);
      setPayments(await userService.getMyPayments());
    } catch {
      setPayments([]);
      setError("No se pudieron cargar tus pagos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments().catch(console.error);
  }, []);

  const totalSpent = useMemo(
    () => payments.reduce((accumulator, payment) => accumulator + Number(payment.amount || 0), 0),
    [payments],
  );

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="eyebrow">Pagos</p>
          <h2>Mis pagos</h2>
          <p>Total abonado: ${totalSpent.toFixed(2)}</p>
        </div>
        <Button variant="secondary" onClick={() => loadPayments()}>
          Actualizar
        </Button>
      </header>

      {loading ? <div className="surface min-h-[140px] grid place-items-center text-center text-[#aab8c9]">Cargando pagos...</div> : null}
      {error ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{error}</div> : null}
      {!loading && payments.length === 0 ? <div className="surface min-h-[140px] grid place-items-center text-center text-[#aab8c9]">Todavia no tienes pagos registrados.</div> : null}

      <div className="grid gap-[0.85rem]">
        {payments.map((payment) => (
          <article key={payment.id} className="surface grid gap-4">
            <div className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-start">
              <div>
                <p className="eyebrow">{payment.method || "Pago"}</p>
                <h3>${Number(payment.amount || 0).toFixed(2)}</h3>
              </div>
              <span className={`inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border border-white/[0.18] bg-slate-950/70 text-sm status-${payment.status.toLowerCase()}`}>{STATUS_LABEL[payment.status]}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div>
                <span className="meta-label">Servicio</span>
                <strong>{payment.appointment?.service?.name || "Sin servicio"}</strong>
              </div>
              <div>
                <span className="meta-label">Local</span>
                <strong>{payment.appointment?.local?.name || "Sin local"}</strong>
              </div>
              <div>
                <span className="meta-label">Turno</span>
                <strong>
                  {payment.appointment?.startDateTime
                    ? new Date(payment.appointment.startDateTime).toLocaleString("es-AR")
                    : "Sin fecha"}
                </strong>
              </div>
              <div>
                <span className="meta-label">Referencia</span>
                <strong>{payment.mercadoPagoExternalReference || "Sin referencia"}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}