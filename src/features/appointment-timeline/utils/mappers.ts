import type { BackendAppointment, BackendTimeStock } from '@/services/timeline';
import type { Appointment, Block, AppointmentStatus } from '../types';

function mapState(state: string): AppointmentStatus {
  switch (state) {
    case 'PENDING': return 'PENDING';
    case 'CONFIRMED': return 'CONFIRMED';
    case 'CANCELLED': return 'CANCELLED';
    case 'COMPLETED': return 'COMPLETED';
    default: return 'PENDING';
  }
}

export function mapBackendAppointment(raw: BackendAppointment, localId: string): Appointment {
  return {
    id: String(raw.id),
    resourceId: raw.employeeId ?? localId,
    startAt: new Date(raw.startDateTime),
    endAt: new Date(raw.endDateTime),
    title: raw.service?.name || raw.userName || 'Sin título',
    status: mapState(raw.state),
    customerName: raw.userName,
    customerEmail: raw.email,
    serviceName: raw.service?.name,
  };
}

export function mapBackendTimeStock(raw: BackendTimeStock, localId: string): Block | null {
  if (raw.status !== 'BLOCKED') return null;

  return {
    id: raw.id,
    resourceId: raw.employeeId ?? localId,
    startAt: new Date(raw.moduleStartTime),
    endAt: new Date(raw.moduleEndTime),
    notes: raw.notes ?? undefined,
  };
}

export function mapBackendAppointments(
  raws: BackendAppointment[],
  localId: string,
): Appointment[] {
  return raws.map((r) => mapBackendAppointment(r, localId));
}

export function mapBackendTimeStocks(
  raws: BackendTimeStock[],
  localId: string,
): Block[] {
  return raws
    .map((r) => mapBackendTimeStock(r, localId))
    .filter((b): b is Block => b !== null);
}

export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateRange(start: Date, end: Date): { minDate: string; maxDate: string } {
  const minDate = formatDateParam(start);
  const maxDate = formatDateParam(end);
  return { minDate, maxDate };
}
