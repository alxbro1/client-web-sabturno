import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { getFriendlyDateTime, formatCurrency } from "@/lib/utils/date";
import type { Appointment } from "@/lib/types/booking";
import { Button } from "@/components/Button";
import { IconClock } from "@/components/Icons";

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

const STATUS_LABELS: Record<Appointment["state"], string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
};

const STATUS_CLASSES: Record<Appointment["state"], string> = {
  CONFIRMED: "text-[#00f068] bg-[#00f068]/10 border-[#00f068]/30",
  PENDING: "text-[#f0c040] bg-[#f0c040]/10 border-[#f0c040]/30",
  CANCELLED: "text-[#ff5678] bg-[#ff5678]/10 border-[#ff5678]/30",
  COMPLETED: "text-white/50 bg-white/5 border-white/12",
};

const STATUS_CLASSES_PRIMARY: Record<Appointment["state"], string> = {
  CONFIRMED: "text-[#0d2f1b] bg-[#0a0a0a]/8 border-[#0a0a0a]/12",
  PENDING: "text-[#4c3200] bg-[#0a0a0a]/8 border-[#0a0a0a]/12",
  CANCELLED: "text-[#4f0e1f] bg-[#0a0a0a]/8 border-[#0a0a0a]/12",
  COMPLETED: "text-[#0a0a0a]/70 bg-[#0a0a0a]/6 border-[#0a0a0a]/10",
};

function AppointmentCardComponent({ appointment, showCancel, onCancel, highlightAsPrimary = false }: AppointmentCardProps) {
  const timezone = appointment.timezone || appointment.local?.timezone;
  const formattedDateTime = useMemo(
    () => getFriendlyDateTime(appointment.startDateTime, timezone),
    [appointment.startDateTime, timezone],
  );
  const formattedPrice = useMemo(() => formatCurrency(appointment.service?.cost), [appointment.service?.cost]);
  const cardClass = highlightAsPrimary
    ? "border-transparent bg-[linear-gradient(180deg,#6bffb0_0%,#00f068_100%)]"
    : "border-white/10 bg-[#12141a]";
  const titleClass = highlightAsPrimary ? "text-[#07150d]" : "text-white";
  const subtitleClass = highlightAsPrimary ? "!text-[#07150d]/80" : "text-white/60";
  const dateChipClass = highlightAsPrimary
    ? "border-[#0a0a0a]/12 bg-[#0a0a0a]/8 text-[#07150d]"
    : "border-white/12 bg-white/6 text-white/80";
  const priceChipClass = highlightAsPrimary
    ? "border-[#0a0a0a]/12 bg-[#0a0a0a]/8 text-[#07150d]"
    : "border-[#00f068]/30 bg-[#00f068]/10 text-[#00f068]";
  const statusClass = highlightAsPrimary ? STATUS_CLASSES_PRIMARY[appointment.state] : STATUS_CLASSES[appointment.state];

  return (
    <article className={`flex items-start justify-between gap-4 border rounded-2xl p-4 [content-visibility:auto] [contain:layout_paint_style] [contain-intrinsic-size:120px] max-sm:flex-col ${cardClass}`}>
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold truncate mb-0.5 ${titleClass}`}>{appointment.local?.name}</h3>
        <p className={`text-sm truncate !my-2 ${subtitleClass}`}>{appointment.service?.name}</p>

        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:flex-shrink-0 ${dateChipClass}`}>
            <IconClock />
            {formattedDateTime}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${priceChipClass}`}>
            {formattedPrice}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${statusClass}`}>
            {STATUS_LABELS[appointment.state]}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 max-sm:flex-row max-sm:w-full max-sm:justify-between">
        {showCancel ? (
          <Button className='!py-2 !px-4' variant="danger" onClick={() => onCancel?.(appointment.id)}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function AppointmentsEmptyState({ title, description, ctaLabel = "Reservar turno" }: AppointmentsEmptyStateProps) {
  return (
    <div className="border border-white/10 bg-[#12141a] rounded-2xl p-5 min-h-[220px] grid place-items-center text-center">
      <div className="grid max-w-[28rem] gap-4 justify-items-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#00f068]/20 bg-[#00f068]/10 text-[#00f068]">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
          </svg>
        </div>
        <div className="grid gap-2">
          <h3>{title}</h3>
          <p className="text-white/68">{description}</p>
        </div>
        <Link to="/booking/select-local">
          <Button>{ctaLabel}</Button>
        </Link>
      </div>
    </div>
  );
}

export const AppointmentCard = memo(AppointmentCardComponent);