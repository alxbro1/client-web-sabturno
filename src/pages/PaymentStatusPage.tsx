import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { bookingService } from "@/services/booking";
import type { PaymentStatusResponse } from "@/lib/types/booking";

const STATUS_LABELS: Record<PaymentStatusResponse["status"], string> = {
  COMPLETED: "Aprobado",
  PENDING: "Pendiente",
  FAILED: "Rechazado",
};

export function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const externalReference = searchParams.get("externalReference") || "";
  const result = searchParams.get("result");
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentStatus = useCallback(async () => {
    if (!externalReference) {
      setError("No se informo una referencia de pago.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.getPaymentStatusByExternalReference(externalReference);
      setPayment(response);
    } catch {
      setPayment(null);
      setError("No pudimos consultar el estado del pago.");
    } finally {
      setLoading(false);
    }
  }, [externalReference]);

  useEffect(() => {
    loadPaymentStatus().catch(console.error);
  }, [loadPaymentStatus]);

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="eyebrow">Pago</p>
          <h2>Estado del pago</h2>
          <p>Referencia: {externalReference || "Sin referencia"}</p>
        </div>
      </header>

      {result ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-cyan-950/30 text-sky-200">Resultado inicial informado por Mercado Pago: {result}</div> : null}

      <div className="surface grid gap-[0.85rem]">
        {loading ? <p>Consultando estado...</p> : null}
        {error ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{error}</div> : null}
        {payment ? (
          <>
            <span className={`inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border border-white/[0.18] bg-slate-950/70 text-sm w-fit status-${payment.status.toLowerCase()}`}>{STATUS_LABELS[payment.status]}</span>
            <p>Monto: ${Number(payment.amount || 0).toFixed(2)}</p>
            <p>Actualizado: {new Date(payment.updatedAt).toLocaleString("es-AR")}</p>
          </>
        ) : null}
        <Button variant="secondary" onClick={() => loadPaymentStatus()} disabled={loading || !externalReference}>
          Actualizar estado
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Link to="/appointments">
          <Button>Ir a mis turnos</Button>
        </Link>
        <Link to="/home">
          <Button variant="secondary">Volver al inicio</Button>
        </Link>
      </div>
    </section>
  );
}