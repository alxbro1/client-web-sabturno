"use client";

import { CalendarDays, Clock, MapPin, Scissors } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency, parseDateOnlyToLocal } from "@/lib/utils/date";
import { useBookingStore } from "@/stores/booking";

function formatLongDate(dateOnly: string) {
  return parseDateOnlyToLocal(dateOnly).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

type BookingSummaryProps = {
  /** Descuento de fidelidad ya calculado, si aplica. */
  discount?: number;
};

/**
 * Resumen de lo que se está reservando. Se muestra en el último paso, donde el
 * usuario confirma un turno real y necesita ver qué está por confirmar.
 */
export function BookingSummary({ discount = 0 }: BookingSummaryProps) {
  const local = useBookingStore((s) => s.local);
  const service = useBookingStore((s) => s.service);
  const date = useBookingStore((s) => s.date);
  const time = useBookingStore((s) => s.time);

  if (!local || !service) return null;

  const cost = Number(service.cost || 0);
  const total = Math.max(0, cost - discount);

  return (
    <Card className="w-full gap-0 p-5">
      <h3 className="text-sm font-semibold text-foreground">Tu reserva</h3>

      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex items-start gap-2">
          <Scissors aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <dt className="sr-only">Servicio</dt>
          <dd className="font-medium text-foreground">
            {service.name}
            <span className="ml-2 font-normal text-muted-foreground">
              {service.duration} min
            </span>
          </dd>
        </div>

        <div className="flex items-start gap-2">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <dt className="sr-only">Local</dt>
          <dd className="text-muted-foreground">{local.name}</dd>
        </div>

        {date ? (
          <div className="flex items-start gap-2">
            <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <dt className="sr-only">Fecha</dt>
            <dd className="text-muted-foreground first-letter:uppercase">
              {formatLongDate(date)}
            </dd>
          </div>
        ) : null}

        {time ? (
          <div className="flex items-start gap-2">
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <dt className="sr-only">Hora</dt>
            <dd className="text-muted-foreground">{time} hs</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 border-t border-border pt-3 text-sm">
        {discount > 0 ? (
          <>
            <div className="flex justify-between text-muted-foreground">
              <span>Servicio</span>
              <span>{formatCurrency(cost)}</span>
            </div>
            <div className="flex justify-between text-primary">
              <span>Descuento</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          </>
        ) : null}
        <div className="flex justify-between font-semibold text-foreground">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </Card>
  );
}
