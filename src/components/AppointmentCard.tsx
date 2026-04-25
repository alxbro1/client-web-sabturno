import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { getFriendlyDateTime, formatCurrency } from "@/lib/utils/date";
import type { Appointment } from "@/lib/types/booking";
import { Button } from "@/components/Button";

type AppointmentCardProps = {
  appointment: Appointment;
  showCancel?: boolean;
  onCancel?: (appointmentId: number) => void | Promise<void>;
};

type AppointmentsEmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
};

const STATUS_LABELS: Record<Appointment["status"], string> = {
  confirmed: "Confirmado",
  pending: "Pendiente",
  cancelled: "Cancelado",
  completed: "Completado",
};

function AppointmentCardComponent({ appointment, showCancel, onCancel }: AppointmentCardProps) {
  const timezone = appointment.timezone || appointment.local?.timezone;
  const formattedDateTime = useMemo(
    () => getFriendlyDateTime(appointment.startDateTime, timezone),
    [appointment.startDateTime, timezone],
  );
  const formattedPrice = useMemo(() => formatCurrency(appointment.service?.cost), [appointment.service?.cost]);

  return (
    <article className="border border-white/10 bg-[#12141a] rounded-2xl p-5 grid gap-4 [content-visibility:auto] [contain:layout_paint_style] [contain-intrinsic-size:260px]">
      <div className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-start">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">{appointment.local?.name}</p>
          <h3>{appointment.service?.name}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div>
          <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">Turno</span>
          <strong>{formattedDateTime}</strong>
        </div>
        <div>
          <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">Precio</span>
          <strong>{formattedPrice}</strong>
        </div>
        <div>
          <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">Direccion</span>
          <strong>{appointment.local?.address}</strong>
        </div>
        <div>
          <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">Ciudad</span>
          <strong>{appointment.local?.city}</strong>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Link className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72" to="/booking/select-local">
          Reservar otro turno
        </Link>
        {showCancel ? (
          <Button variant="danger" onClick={() => onCancel?.(appointment.id)}>
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