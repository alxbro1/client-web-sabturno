import { Day, Schedule } from '../types/schedule.types';

export const DAYS: Day[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export const INITIAL_SCHEDULE: Schedule = {
  monday: { active: false, timeSlots: [{ start: '09:00', end: '18:00' }] },
  tuesday: { active: false, timeSlots: [{ start: '09:00', end: '18:00' }] },
  wednesday: { active: false, timeSlots: [{ start: '09:00', end: '18:00' }] },
  thursday: { active: false, timeSlots: [{ start: '09:00', end: '18:00' }] },
  friday: { active: false, timeSlots: [{ start: '09:00', end: '18:00' }] },
  saturday: { active: false, timeSlots: [{ start: '09:00', end: '13:00' }] },
  sunday: { active: false, timeSlots: [{ start: '00:00', end: '00:00' }] },
};

export const DEFAULT_TIME_SLOT = { start: '09:00', end: '18:00' };