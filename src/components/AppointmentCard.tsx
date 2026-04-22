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
  const formattedPrice = useMemo(() => formatCurrency(appointment.service.cost), [appointment.service.cost]);

  return (
    <article className="surface grid gap-4 [content-visibility:auto] [contain:layout_paint_style] [contain-intrinsic-size:260px]">
      <div className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-start">
        <div>
          <p className="eyebrow">{appointment.local.name}</p>
          <h3>{appointment.service.name}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div>
          <span className="meta-label">Turno</span>
          <strong>{formattedDateTime}</strong>
        </div>
        <div>
          <span className="meta-label">Precio</span>
          <strong>{formattedPrice}</strong>
        </div>
        <div>
          <span className="meta-label">Direccion</span>
          <strong>{appointment.local.address}</strong>
        </div>
        <div>
          <span className="meta-label">Ciudad</span>
          <strong>{appointment.local.city}</strong>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Link className="text-sky-300" to="/booking/select-local">
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

export const AppointmentCard = memo(AppointmentCardComponent);