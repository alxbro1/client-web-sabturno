import { memo, useMemo } from "react";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { getFriendlyDateTime, formatCurrency } from "@/lib/utils/date";
import type { Appointment } from "@/lib/types/booking";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type AppointmentCardProps = {
  appointment: Appointment;
  showCancel?: boolean;
  onCancel?: (appointmentId: number) => void | Promise<void>;
  highlightAsPrimary?: boolean;
};

type AppointmentsEmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
};

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */
const STATUS_LABELS: Record<Appointment["state"], string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
};

const STATUS_CLASSES = {
  CONFIRMED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  PENDING:
    "border-amber-400/30 bg-amber-400/10 text-amber-400",
  CANCELLED:
    "border-rose-500/30 bg-rose-500/10 text-rose-500",
  COMPLETED:
    "border bg-muted text-muted-foreground",
} as const satisfies Record<Appointment["state"], string>;

const STATUS_CLASSES_PRIMARY = {
  CONFIRMED:
    "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground",
  PENDING:
    "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground",
  CANCELLED:
    "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground",
  COMPLETED:
    "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground/70",
} as const satisfies Record<Appointment["state"], string>;

/* ------------------------------------------------------------------ */
/*  AppointmentCard                                                    */
/* ------------------------------------------------------------------ */
function AppointmentCardComponent({
  appointment,
  showCancel,
  onCancel,
  highlightAsPrimary = false,
}: AppointmentCardProps) {
  const timezone = appointment.timezone || appointment.local?.timezone;
  const formattedDateTime = useMemo(
    () => getFriendlyDateTime(appointment.startDateTime, timezone),
    [appointment.startDateTime, timezone],
  );
  const formattedPrice = useMemo(
    () => formatCurrency(appointment.service?.cost),
    [appointment.service?.cost],
  );

  return (
    <article
      className={cn(
        "flex items-start justify-between gap-4 rounded-xl border p-4 max-sm:flex-col",
        "[content-visibility:auto] [contain:layout_paint_style] [contain-intrinsic-size:120px]",
        highlightAsPrimary
          ? "border-transparent bg-primary"
          : "bg-card",
      )}
    >
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "mb-0.5 truncate font-bold",
            highlightAsPrimary
              ? "text-primary-foreground"
              : "text-foreground",
          )}
        >
          {appointment.local?.name}
        </h3>
        <p
          className={cn(
            "my-2 truncate text-sm",
            highlightAsPrimary
              ? "text-primary-foreground/80"
              : "text-muted-foreground",
          )}
        >
          {appointment.service?.name}
        </p>

        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              "[&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0",
              highlightAsPrimary
                ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Clock />
            {formattedDateTime}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
              highlightAsPrimary
                ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
                : "border-primary/30 bg-primary/10 text-primary",
            )}
          >
            {formattedPrice}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
              highlightAsPrimary
                ? STATUS_CLASSES_PRIMARY[appointment.state]
                : STATUS_CLASSES[appointment.state],
            )}
          >
            {STATUS_LABELS[appointment.state]}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 max-sm:flex-row max-sm:w-full max-sm:justify-between">
        {showCancel && (
          <Button
            className="!px-4 !py-2"
            variant="danger"
            onClick={() => onCancel?.(appointment.id)}
          >
            Cancelar
          </Button>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  AppointmentsEmptyState                                             */
/* ------------------------------------------------------------------ */
export function AppointmentsEmptyState({
  title,
  description,
  ctaLabel = "Reservar turno",
}: AppointmentsEmptyStateProps) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-xl border bg-card p-5 text-center">
      <div className="grid max-w-[28rem] gap-4 justify-items-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <CalendarDays className="size-7" />
        </div>
        <div className="grid gap-2">
          <h3>{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Link href="/booking/select-local">
          <Button>{ctaLabel}</Button>
        </Link>
      </div>
    </div>
  );
}

export const AppointmentCard = memo(AppointmentCardComponent);
