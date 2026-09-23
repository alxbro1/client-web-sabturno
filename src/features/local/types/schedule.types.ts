export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DaySchedule {
  active: boolean;
  timeSlots: TimeSlot[];
}

export interface Day {
  key: DayKey;
  label: string;
}

export type Schedule = Record<DayKey, DaySchedule>;

export interface ScheduleTemplateFromAPI {
  id: string;
  isActive: boolean;
  name: string;
  timeSlotsCount: number;
  /** Plantilla de un empleado especifico, o local-wide si es null/ausente. */
  employeeId?: string | null;
  employeeName?: string | null;
}

export interface TimeStockTemplate {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  localId: string;
  scheduleTemplateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  isActive: boolean;
  localId: string;
  /** Plantilla de un empleado especifico, o local-wide si es null/ausente. */
  employeeId?: string | null;
  employee?: { id: string; name: string } | null;
  timeStockTemplates: TimeStockTemplate[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleTemplateRequest {
  name: string;
  localId: string;
  /**
   * Formato preferido (matchea el `CreateScheduleTemplateDto` del backend
   * en `backend/src/timestock-template/dto/create-schedule-template.dto.ts`).
   * El backend acepta tambien un array `timeStockTemplates` como fallback
   * legacy, pero el contrato canonico es este.
   */
  schedule: Schedule;
  /** Asigna esta plantilla a un empleado. Omitir = plantilla del local. */
  employeeId?: string;
}