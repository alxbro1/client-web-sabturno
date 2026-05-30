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
  timeStockTemplates: TimeStockTemplate[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleTemplateRequest {
  name: string;
  localId: string;
  timeStockTemplates: TimeStockTemplate[];
}