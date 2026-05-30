import { useMemo } from 'react';
import { Schedule } from '../types/schedule.types';
import { hasTimeSlotOverlap, isEndTimeAfterStart, isValidTimeFormat, timeStringToMinutes } from '../utils/timeValidation';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const useScheduleValidation = (
  templateName: string,
  schedule: Schedule
): ValidationResult => {
  return useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!templateName.trim()) {
      errors.push('Ingresa un nombre para el template.');
    }

    const activeDays = Object.entries(schedule).filter(([_, { active }]) => active);
    if (activeDays.length === 0) {
      errors.push('Selecciona al menos un día activo.');
    }

    activeDays.forEach(([dayKey, daySchedule]) => {
      const { timeSlots } = daySchedule;

      if (timeSlots.length === 0) {
        errors.push(`${dayKey} debe tener al menos un horario.`);
        return;
      }

      timeSlots.forEach((slot, index) => {
        if (!isValidTimeFormat(slot.start)) {
          errors.push(`${dayKey}: Formato de hora de inicio inválido en el horario ${index + 1}.`);
        }
        if (!isValidTimeFormat(slot.end)) {
          errors.push(`${dayKey}: Formato de hora de fin inválido en el horario ${index + 1}.`);
        }
      });

      timeSlots.forEach((slot, index) => {
        if (!isEndTimeAfterStart(slot.start, slot.end)) {
          errors.push(`${dayKey}: La hora de fin debe ser posterior a la hora de inicio en el horario ${index + 1}.`);
        }
      });

      if (hasTimeSlotOverlap(timeSlots)) {
        warnings.push(`${dayKey}: Tienes horarios que se superponen.`);
      }

      timeSlots.forEach((slot, index) => {
        const duration = (timeStringToMinutes(slot.end) - timeStringToMinutes(slot.start)) / 60;
        if (duration < 1) {
          warnings.push(`${dayKey}: El horario ${index + 1} tiene una duración muy corta (menos de 1 hora).`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [templateName, schedule]);
};