import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Appointment } from '../types';
import { STATUS_COLORS } from '../constants';
import { Tooltip } from './Tooltip';

interface AppointmentBlockProps {
  appointment: Appointment;
  top: number;
  height: number;
  width: number;
  theme: 'light' | 'dark';
  onClick?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export function AppointmentBlock({
  appointment,
  top,
  height,
  width,
  theme,
  onClick,
}: AppointmentBlockProps) {
  const colors = STATUS_COLORS[appointment.status];
  const colorClass = colors[theme];
  const cursorClass = onClick ? 'cursor-pointer' : 'cursor-default';

  const timeRange = `${format(appointment.startAt, 'HH:mm')} - ${format(appointment.endAt, 'HH:mm')}`;

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-semibold">
        {appointment.title || appointment.customerName || 'Sin título'}
      </div>
      <div className="opacity-75">{timeRange}</div>
      {appointment.serviceName && (
        <div className="opacity-75">{appointment.serviceName}</div>
      )}
      {appointment.customerName && (
        <div className="opacity-60">{appointment.customerName}</div>
      )}
      {appointment.customerEmail && (
        <div className="opacity-60">{appointment.customerEmail}</div>
      )}
      <div className="mt-1 pt-1 border-t border-current/20 font-medium">
        {STATUS_LABELS[appointment.status] || appointment.status}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} theme={theme}>
      <div
        onClick={onClick}
        className={`absolute z-10 rounded-md border p-2 text-xs overflow-hidden transition-[transform,box-shadow] duration-140 hover:shadow-lg hover:-translate-y-px hover:z-20 ${colorClass} ${cursorClass}`}
        style={{
          top,
          height,
          width,
          minHeight: 30,
        }}
      >
        <div className="font-medium truncate">
          {appointment.title || appointment.customerName || 'Sin título'}
        </div>
        {appointment.serviceName && (
          <div className="truncate opacity-75 mt-0.5">
            {appointment.serviceName}
          </div>
        )}
        <div className="truncate opacity-60 mt-0.5">
          {appointment.customerName || appointment.customerEmail}
        </div>
      </div>
    </Tooltip>
  );
}
