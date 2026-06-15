import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { blockingService } from '../services/blocking.service';
import { calendarService } from '../services/calendar.service';
import {
  BlockedDateRange,
  CalendarDay,
  WorkingDayTemplate
} from '../types/calendar.types';
import {
  calculateDayStatus,
  calculateMaxCapacity,
  calculateOccupancyPercentage,
  generateCalendarDays,
  getDateRange,
  getWorkingDayTemplate,
  isCurrentMonth,
  isDateBlocked,
  utcToLocalDate
} from '../utils/calendarUtils';

interface UseLocalCalendarReturn {
  calendarDays: CalendarDay[];
  currentMonth: number;
  currentYear: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
  goToToday: () => void;
  refreshCalendar: () => Promise<void>;
  blockedDates: BlockedDateRange[];
  blockDate: (startDate: Date, endDate: Date, reason: string) => Promise<boolean>;
  unblockDate: (blockedDateId: string) => Promise<boolean>;
  workingDayTemplates: WorkingDayTemplate[];
  monthStats: {
    totalDays: number;
    blockedDays: number;
    workingDays: number;
    appointmentDays: number;
    averageOccupancy: number;
  };
}

export const useLocalCalendar = (): UseLocalCalendarReturn => {
  const { user } = useAuthStore();
  const localId = user?.id;

  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [appointmentCounts, setAppointmentCounts] = useState<{ [date: string]: number }>({});
  const [blockedDates, setBlockedDates] = useState<BlockedDateRange[]>([]);
  const [workingDayTemplates, setWorkingDayTemplates] = useState<WorkingDayTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const allDays = generateCalendarDays(currentMonth, currentYear);

    return allDays.map(date => {
      const dateKey = date.toISOString().split('T')[0];
      const appointmentCount = appointmentCounts[dateKey] || 0;
      const dayOfWeek = date.getDay();

      const isBlocked = isDateBlocked(date, blockedDates);

      const workingTemplate = getWorkingDayTemplate(dayOfWeek, workingDayTemplates);
      const isWorkingDay = !!workingTemplate;

      const maxCapacity = workingTemplate ?
        calculateMaxCapacity(workingTemplate.startTime, workingTemplate.endTime) : 0;

      const status = calculateDayStatus(appointmentCount, maxCapacity, isBlocked, isWorkingDay);

      const occupancyPercentage = calculateOccupancyPercentage(appointmentCount, maxCapacity);

      return {
        date,
        status,
        appointmentCount,
        isBlocked,
        isWorkingDay,
        maxCapacity,
        occupancyPercentage,
        blockReason: isBlocked ?
          blockedDates.find(range =>
            date >= range.startDate && date <= range.endDate
          )?.reason : undefined
      } as CalendarDay;
    });
  }, [currentMonth, currentYear, appointmentCounts, blockedDates, workingDayTemplates]);

  const monthStats = useMemo(() => {
    const currentMonthDays = calendarDays.filter(day =>
      isCurrentMonth(day.date, currentMonth, currentYear)
    );

    const totalDays = currentMonthDays.length;
    const blockedDays = currentMonthDays.filter(day => day.isBlocked).length;
    const workingDays = currentMonthDays.filter(day => day.isWorkingDay && !day.isBlocked).length;
    const appointmentDays = currentMonthDays.filter(day => day.appointmentCount > 0).length;

    const totalOccupancy = currentMonthDays.reduce((sum, day) =>
      sum + (day.occupancyPercentage || 0), 0
    );
    const averageOccupancy = workingDays > 0 ? totalOccupancy / workingDays : 0;

    return {
      totalDays,
      blockedDays,
      workingDays,
      appointmentDays,
      averageOccupancy: Math.round(averageOccupancy)
    };
  }, [calendarDays, currentMonth, currentYear]);

  const fetchCalendarData = useCallback(async () => {
    if (!localId) return;

    try {
      setError(null);

      const { startDate, endDate } = getDateRange(currentMonth, currentYear);

      const [
        appointmentData,
        blockedData,
        workingDaysData
      ] = await Promise.all([
        calendarService.getAppointmentCountByDay(localId, startDate, endDate),
        calendarService.getBlockedDates(localId, startDate, endDate),
        calendarService.getWorkingDaysFromTemplates(localId),
      ]);

      setAppointmentCounts(appointmentData);
      setBlockedDates(blockedData);
      setWorkingDayTemplates(workingDaysData);

    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Error al cargar el calendario');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [localId, currentMonth, currentYear]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  }, [currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }, []);

  const refreshCalendar = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCalendarData();
  }, [fetchCalendarData]);

  const blockDate = useCallback(async (
    startDate: Date,
    endDate: Date,
    reason: string
  ): Promise<boolean> => {
    if (!localId) return false;

    try {
      const createdRanges: BlockedDateRange[] = [];

      const isSameDay = startDate.toDateString() === endDate.toDateString();
      const startIsMidnight = startDate.getHours() === 0 && startDate.getMinutes() === 0;
      const endIsMidnight = endDate.getHours() === 0 && endDate.getMinutes() === 0;

      if (startIsMidnight && endIsMidnight && !isSameDay) {
        const datesToBlock: string[] = [];
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
          datesToBlock.push(cursor.toISOString().split('T')[0]);
          cursor.setDate(cursor.getDate() + 1);
        }

        for (const dateStr of datesToBlock) {
          const created = await blockingService.createBlockedDate({ localId, date: dateStr, notes: reason });
          const normalized: BlockedDateRange = {
            id: created.id,
            startDate: utcToLocalDate(created.date),
            endDate: utcToLocalDate(created.date),
            reason: created.notes || '',
            localId: created.localId,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt
          };
          createdRanges.push(normalized);
        }
      } else if (isSameDay && (!startIsMidnight || !endIsMidnight)) {
        const dateStr = startDate.toISOString().split('T')[0];
        const startTime = startDate.toTimeString().substring(0,5);
        const endTime = endDate.toTimeString().substring(0,5);
        const created = await blockingService.createBlockedTimeSlot({ localId, date: dateStr, startTime, endTime, notes: reason });
        const normalized: BlockedDateRange = {
          id: created.id,
          startDate: utcToLocalDate(created.moduleStartTime),
          endDate: utcToLocalDate(created.moduleEndTime),
          reason: created.notes || '',
          localId: created.localId,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt
        };
        createdRanges.push(normalized);
      } else {
        const dateStr = startDate.toISOString().split('T')[0];
        const created = await blockingService.createBlockedDate({ localId, date: dateStr, notes: reason });
        const normalized: BlockedDateRange = {
          id: created.id,
          startDate: utcToLocalDate(created.date),
          endDate: utcToLocalDate(created.date),
          reason: created.notes || '',
          localId: created.localId,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt
        };
        createdRanges.push(normalized);
      }

      setBlockedDates(prev => [...prev, ...createdRanges]);
      return true;
    } catch (err) {
      console.error('Error blocking date:', err);
      return false;
    }
  }, [localId]);

  const unblockDate = useCallback(async (blockedDateId: string): Promise<boolean> => {
    if (!localId) return false;

    try {
      const success = await calendarService.unblockDate(localId, blockedDateId);
      if (success) {
        setBlockedDates(prev => prev.filter(date => date.id !== blockedDateId));
      }
      return success;
    } catch (err) {
      console.error('Error unblocking date:', err);
      return false;
    }
  }, [localId]);

  useEffect(() => {
    if (localId) {
      setIsLoading(true);
      fetchCalendarData();
    }
  }, [localId, currentMonth, currentYear, fetchCalendarData]);

  return {
    calendarDays,
    currentMonth,
    currentYear,
    isLoading,
    isRefreshing,
    error,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
    refreshCalendar,
    blockedDates,
    blockDate,
    unblockDate,
    workingDayTemplates,
    monthStats
  };
};