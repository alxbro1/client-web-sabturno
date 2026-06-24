"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/ui/card";
import { usePaymentStatusQuery } from "@/hooks/queries/usePaymentStatusQuery";

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Aprobado",
  PENDING: "Pendiente",
  FAILED: "Rechazado",
  SUCCESS: "Aprobado",
  CANCELLED: "Cancelado",
};

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: "text-emerald-400",
  PENDING: "text-amber-400",
  FAILED: "text-destructive",
  SUCCESS: "text-emerald-400",
  CANCELLED: "text-destructive",
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
    <section className="grid gap-6 p-8">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Pago
          </p>
          <h2 className="text-2xl font-bold text-foreground">Estado del pago</h2>
          <p className="text-muted-foreground">
            Referencia: {externalReference || "Sin referencia"}
          </p>
        </div>
      </header>

      {result ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary-foreground">
          Resultado inicial informado por Mercado Pago: {result}
        </div>
      ) : null}

      <Card className="p-5 grid gap-3">
        {isLoading ? <p className="text-muted-foreground">Consultando estado...</p> : null}

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}

        {data?.type === "talo" && data.data ? (
          <>
            <span
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-border bg-card text-sm w-fit ${STATUS_CLASS[data.data.status] ?? ""}`}
            >
              {STATUS_LABELS[data.data.status] ?? data.data.status}
            </span>
            <p className="text-sm text-muted-foreground">
              Monto: ${Number(data.data.amount || 0).toFixed(2)}{" "}
              {data.data.currency}
            </p>
            <p className="text-sm text-muted-foreground">ID Pago: {data.data.id}</p>
            <p className="text-sm text-muted-foreground">
              Creado:{" "}
              {new Date(data.data.createdAt).toLocaleString("es-AR")}
            </p>
          </>
        ) : data?.type === "mercadopago" && data.data ? (
          <>
            <span
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-border bg-card text-sm w-fit ${STATUS_CLASS[data.data.status] ?? ""}`}
            >
              {STATUS_LABELS[data.data.status] ?? data.data.status}
            </span>
            <p className="text-sm text-muted-foreground">
              Monto: ${Number(data.data.amount || 0).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              Actualizado:{" "}
              {new Date(data.data.updatedAt).toLocaleString("es-AR")}
            </p>
          </>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            disabled={isLoading || (!externalReference && !taloPaymentId)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="size-4" />
            Actualizar estado
          </Button>
        </div>
      </Card>

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
