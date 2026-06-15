import { DayStatus, WorkingDayTemplate } from '../types/calendar.types';
import { TRAFFIC_THRESHOLDS, CALENDAR_CONSTANTS } from '../constants/calendarColors';

export const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (month: number, year: number): number => {
  return new Date(year, month, 1).getDay();
};

export const generateCalendarDays = (month: number, year: number): Date[] => {
  const firstDay = getFirstDayOfMonth(month, year);
  const daysInMonth = getDaysInMonth(month, year);
  const daysInPrevMonth = getDaysInMonth(month - 1, year);

  const days: Date[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, daysInPrevMonth - i));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  const totalCells = CALENDAR_CONSTANTS.DAYS_PER_WEEK * CALENDAR_CONSTANTS.WEEKS_PER_MONTH;
  const remainingCells = totalCells - days.length;

  for (let day = 1; day <= remainingCells; day++) {
    days.push(new Date(year, month + 1, day));
  }

  return days;
};

export const calculateDayStatus = (
  appointmentCount: number,
  maxCapacity: number,
  isBlocked: boolean,
  isWorkingDay: boolean
): DayStatus => {
  if (isBlocked) {
    return DayStatus.BLOCKED;
  }

  if (!isWorkingDay) {
    return DayStatus.NON_WORKING;
  }

  if (appointmentCount === 0) {
    return DayStatus.AVAILABLE;
  }

  const occupancyPercentage = (appointmentCount / maxCapacity) * 100;

  if (occupancyPercentage <= TRAFFIC_THRESHOLDS.LOW) {
    return DayStatus.LOW_TRAFFIC;
  } else if (occupancyPercentage <= TRAFFIC_THRESHOLDS.MEDIUM) {
    return DayStatus.MEDIUM_TRAFFIC;
  } else {
    return DayStatus.HIGH_TRAFFIC;
  }
};

export const calculateOccupancyPercentage = (appointmentCount: number, maxCapacity: number): number => {
  if (maxCapacity === 0) return 0;
  return Math.min((appointmentCount / maxCapacity) * 100, 100);
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isCurrentMonth = (date: Date, month: number, year: number): boolean => {
  return date.getMonth() === month && date.getFullYear() === year;
};

export const formatDate = (date: Date, format: 'short' | 'long' | 'day' = 'short'): string => {
  switch (format) {
    case 'long':
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'day':
      return date.getDate().toString();
    default:
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
  }
};

export const formatTime = (time: string): string => {
  return time.slice(0, 5);
};

export const utcToLocalDate = (value: string | Date): Date => {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value.replace(/Z$/, "").replace(/\+00:00$/, ""));
};

export const isDateBlocked = (date: Date, blockedRanges: { startDate: Date; endDate: Date }[]): boolean => {
  return blockedRanges.some(range => {
    const dateTime = date.getTime();
    const startTime = range.startDate.getTime();
    const endTime = range.endDate.getTime();
    return dateTime >= startTime && dateTime <= endTime;
  });
};

export const getWorkingDayTemplate = (
  dayOfWeek: number,
  templates: WorkingDayTemplate[]
): WorkingDayTemplate | null => {
  return templates.find(template => template.dayOfWeek === dayOfWeek && template.isActive) || null;
};

export const calculateMaxCapacity = (
  startTime: string,
  endTime: string,
  slotDuration: number = CALENDAR_CONSTANTS.DEFAULT_SLOT_DURATION
): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  const totalMinutes = endMinutes - startMinutes;

  return Math.floor(totalMinutes / slotDuration);
};

export const getDateRange = (month: number, year: number): { startDate: Date; endDate: Date } => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return { startDate, endDate };
};

export const getMonthNavigation = (currentMonth: number, currentYear: number) => {
  const getPreviousMonth = () => {
    if (currentMonth === 0) {
      return { month: 11, year: currentYear - 1 };
    }
    return { month: currentMonth - 1, year: currentYear };
  };

  const getNextMonth = () => {
    if (currentMonth === 11) {
      return { month: 0, year: currentYear + 1 };
    }
    return { month: currentMonth + 1, year: currentYear };
  };

  return { getPreviousMonth, getNextMonth };
};