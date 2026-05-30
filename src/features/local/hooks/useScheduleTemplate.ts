import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { DEFAULT_TIME_SLOT, INITIAL_SCHEDULE } from '../constants/schedule.constants';
import { scheduleService } from '../services/schedule.service';
import { DayKey, Schedule, ScheduleTemplate, TimeStockTemplate } from '../types/schedule.types';
import { useScheduleValidation } from './useScheduleValidation';

const getDayKey = (dayOfWeek: number): DayKey | null => {
  const map: Record<number, DayKey> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday',
  };
  return map[dayOfWeek] || null;
};

const convertToSchedule = (timeStockTemplates: TimeStockTemplate[]): Schedule => {
  const schedule: Schedule = {
    monday: { active: false, timeSlots: [] },
    tuesday: { active: false, timeSlots: [] },
    wednesday: { active: false, timeSlots: [] },
    thursday: { active: false, timeSlots: [] },
    friday: { active: false, timeSlots: [] },
    saturday: { active: false, timeSlots: [] },
    sunday: { active: false, timeSlots: [] },
  };

  timeStockTemplates.forEach(slot => {
    const dayKey = getDayKey(slot.dayOfWeek);
    if (dayKey && slot.isActive) {
      schedule[dayKey].active = true;
      schedule[dayKey].timeSlots.push({ start: slot.startTime, end: slot.endTime });
    }
  });

  return schedule;
};

const convertToTimeStockTemplates = (schedule: Schedule, templateId: string | null, localId: string): TimeStockTemplate[] => {
  const timeStockTemplates: TimeStockTemplate[] = [];
  Object.entries(schedule).forEach(([dayKey, daySchedule]) => {
    if (daySchedule.active) {
      const dayOfWeek = getDayOfWeek(dayKey as DayKey);
      daySchedule.timeSlots.forEach(slot => {
        timeStockTemplates.push({
          id: '',
          dayOfWeek,
          startTime: slot.start,
          endTime: slot.end,
          isActive: true,
          localId,
          scheduleTemplateId: templateId || '',
          createdAt: '',
          updatedAt: '',
        });
      });
    }
  });
  return timeStockTemplates;
};

const getDayOfWeek = (dayKey: DayKey): number => {
  const map: Record<DayKey, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };
  return map[dayKey];
};

export const useScheduleTemplate = (loadedTemplate?: ScheduleTemplate | null) => {
  const [schedule, setSchedule] = useState<Schedule>(INITIAL_SCHEDULE);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuthStore();

  useEffect(() => {
    if (loadedTemplate) {
      const convertedSchedule = convertToSchedule(loadedTemplate.timeStockTemplates);
      setSchedule(convertedSchedule);
      setTemplateName(loadedTemplate.name);
      setTemplateId(loadedTemplate.id);
      setIsEdit(true);
    } else {
      setSchedule(INITIAL_SCHEDULE);
      setTemplateName('');
      setTemplateId(null);
      setIsEdit(false);
    }
  }, [loadedTemplate]);

  const validation = useScheduleValidation(templateName, schedule);

  const saveTemplate = useCallback(async (): Promise<ScheduleTemplate | null> => {
    if (!validation.isValid) {
      return null;
    }

    if (!user?.id) {
      return null;
    }

    setIsLoading(true);

    try {
      const timeStockTemplates = convertToTimeStockTemplates(schedule, templateId, user.id);

      if (isEdit && templateId) {
        const updateData: ScheduleTemplate = {
          id: templateId,
          name: templateName,
          isActive: loadedTemplate?.isActive || true,
          localId: user.id,
          timeStockTemplates,
          createdAt: loadedTemplate?.createdAt || '',
          updatedAt: new Date().toISOString(),
        };
        return await scheduleService.updateTemplate(templateId, updateData);
      } else {
        return await scheduleService.createTemplate({
          name: templateName,
          localId: user.id,
          timeStockTemplates,
        });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [validation.isValid, schedule, templateId, user?.id, isEdit, loadedTemplate, templateName]);

  const toggleDay = useCallback((key: DayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active },
    }));
  }, []);

  const addTimeSlot = useCallback((key: DayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        timeSlots: [...prev[key].timeSlots, { ...DEFAULT_TIME_SLOT }],
      },
    }));
  }, []);

  const removeTimeSlot = useCallback((key: DayKey, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        timeSlots: prev[key].timeSlots.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const updateTimeSlot = useCallback((
    key: DayKey,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        timeSlots: prev[key].timeSlots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot,
        ),
      },
    }));
  }, []);

  const resetTemplate = useCallback(() => {
    setSchedule(INITIAL_SCHEDULE);
    setTemplateName('');
  }, []);

  return {
    schedule,
    templateName,
    isLoading,
    validation,
    setTemplateName,
    toggleDay,
    addTimeSlot,
    removeTimeSlot,
    updateTimeSlot,
    resetTemplate,
    saveTemplate,
    isEdit,
  };
};