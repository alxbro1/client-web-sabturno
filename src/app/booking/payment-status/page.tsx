"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { usePaymentStatusQuery } from "@/hooks/queries/usePaymentStatusQuery";

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Aprobado",
  PENDING: "Pendiente",
  FAILED: "Rechazado",
  SUCCESS: "Aprobado",
  CANCELLED: "Cancelado",
};

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: "text-[#86efac]",
  PENDING: "text-[#fde68a]",
  FAILED: "text-[#fca5a5]",
  SUCCESS: "text-[#86efac]",
  CANCELLED: "text-[#fca5a5]",
};

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const externalReference = searchParams.get("externalReference") || "";
  const taloPaymentId = searchParams.get("taloPaymentId") || "";
  const result = searchParams.get("result");

  const { data, isLoading, error, refetch } = usePaymentStatusQuery(
    externalReference || null,
    taloPaymentId || null,
  );

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Pago
          </p>
          <h2>Estado del pago</h2>
          <p>Referencia: {externalReference || "Sin referencia"}</p>
        </div>
      </header>

      {result ? (
        <div className="rounded-2xl border border-[#00f068]/32 bg-[rgba(3,58,29,0.36)] px-4 py-[0.95rem] text-[#cdfbe1]">
          Resultado inicial informado por Mercado Pago: {result}
        </div>
      ) : null}

      <div className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 grid gap-[0.85rem]">
        {isLoading ? <p>Consultando estado...</p> : null}

        {error ? (
          <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
            {error.message}
          </div>
        ) : null}

        {data?.type === "talo" && data.data ? (
          <>
            <span
              className={`inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border border-white/[0.18] bg-slate-950/70 text-sm w-fit ${
                STATUS_CLASS[data.data.status] ?? ""
              }`}
            >
              {STATUS_LABELS[data.data.status] ?? data.data.status}
            </span>
            <p>
              Monto: ${Number(data.data.amount || 0).toFixed(2)}{" "}
              {data.data.currency}
            </p>
            <p>ID Pago: {data.data.id}</p>
            <p>
              Creado:{" "}
              {new Date(data.data.createdAt).toLocaleString("es-AR")}
            </p>
          </>
        ) : data?.type === "mercadopago" && data.data ? (
          <>
            <span
              className={`inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border border-white/[0.18] bg-slate-950/70 text-sm w-fit ${
                STATUS_CLASS[data.data.status] ?? ""
              }`}
            >
              {STATUS_LABELS[data.data.status] ?? data.data.status}
            </span>
            <p>Monto: ${Number(data.data.amount || 0).toFixed(2)}</p>
            <p>
              Actualizado:{" "}
              {new Date(data.data.updatedAt).toLocaleString("es-AR")}
            </p>
          </>
        ) : null}

        <Button
          variant="secondary"
          onClick={() => refetch()}
          disabled={isLoading || (!externalReference && !taloPaymentId)}
        >
          Actualizar estado
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Link href="/appointments">
          <Button>Ir a mis turnos</Button>
        </Link>
        <Link href="/home">
          <Button variant="secondary">Volver al inicio</Button>
        </Link>
      </div>
    </section>
  );
}
