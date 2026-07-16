"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/useAuth";
import { calendarService } from "@/features/local/services/calendar.service";
import { blockingService } from "@/features/local/services/blocking.service";
import type {
  BlockedDateRange,
  CalendarDay,
  WorkingDayTemplate,
} from "@/features/local/types/calendar.types";
import { formatDateOnlyLocal } from "@/lib/utils/date";
import {
  generateCalendarDays,
  getDateRange,
  getWorkingDayTemplate,
  calculateDayStatus,
  calculateMaxCapacity,
  calculateOccupancyPercentage,
  isDateBlocked,
  isCurrentMonth,
} from "@/features/local/utils/calendarUtils";

interface CalendarData {
  appointmentCounts: { [date: string]: number };
  blockedDates: BlockedDateRange[];
  workingDayTemplates: WorkingDayTemplate[];
}

async function fetchCalendarData(
  localId: string,
  month: number,
  year: number,
): Promise<CalendarData> {
  const { startDate, endDate } = getDateRange(month, year);
  const [appointmentData, blockedData, workingDaysData] = await Promise.all([
    calendarService.getAppointmentCountByDay(localId, startDate, endDate),
    calendarService.getBlockedDates(localId, startDate, endDate),
    calendarService.getWorkingDaysFromTemplates(localId),
  ]);
  return {
    appointmentCounts: appointmentData,
    blockedDates: blockedData,
    workingDayTemplates: workingDaysData,
  };
}

export function useLocalCalendarQuery() {
  const { user } = useAuth();
  const localId = user?.id ?? "";
  const [currentMonth, setCurrentMonth] = useState(() =>
    new Date().getMonth(),
  );
  const [currentYear, setCurrentYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [blockedDates, setBlockedDates] = useState<BlockedDateRange[]>([]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.localCalendar(localId, currentMonth, currentYear),
    queryFn: () => fetchCalendarData(localId, currentMonth, currentYear),
    enabled: !!localId && !!user?.isLocal,
    staleTime: 30_000,
  });

  const calendarDays = useMemo((): CalendarDay[] => {
    const allDays = generateCalendarDays(currentMonth, currentYear);
    const appointmentCounts = data?.appointmentCounts ?? {};
    const effectiveBlockedDates =
      blockedDates.length > 0 ? blockedDates : (data?.blockedDates ?? []);
    const workingDayTemplates = data?.workingDayTemplates ?? [];

    return allDays.map((date) => {
      const dateKey = formatDateOnlyLocal(date);
      const appointmentCount = appointmentCounts[dateKey] || 0;
      const dayOfWeek = date.getDay();
      const isBlocked = isDateBlocked(date, effectiveBlockedDates);
      const workingTemplate = getWorkingDayTemplate(
        dayOfWeek,
        workingDayTemplates,
      );
      const isWorkingDay = !!workingTemplate;
      const maxCapacity = workingTemplate
        ? calculateMaxCapacity(
            workingTemplate.startTime,
            workingTemplate.endTime,
          )
        : 0;
      const status = calculateDayStatus(
        appointmentCount,
        maxCapacity,
        isBlocked,
        isWorkingDay,
      );
      const occupancyPercentage = calculateOccupancyPercentage(
        appointmentCount,
        maxCapacity,
      );

      return {
        date,
        status,
        appointmentCount,
        isBlocked,
        isWorkingDay,
        maxCapacity,
        occupancyPercentage,
        blockReason: isBlocked
          ? effectiveBlockedDates.find(
              (range) => date >= range.startDate && date <= range.endDate,
            )?.reason
          : undefined,
      } as CalendarDay;
    });
  }, [currentMonth, currentYear, data, blockedDates]);

  const monthStats = useMemo(() => {
    const currentMonthDays = calendarDays.filter((day) =>
      isCurrentMonth(day.date, currentMonth, currentYear),
    );
    const totalDays = currentMonthDays.length;
    const blockedDays = currentMonthDays.filter((day) => day.isBlocked).length;
    const workingDays = currentMonthDays.filter(
      (day) => day.isWorkingDay && !day.isBlocked,
    ).length;
    const appointmentDays = currentMonthDays.filter(
      (day) => day.appointmentCount > 0,
    ).length;
    const totalOccupancy = currentMonthDays.reduce(
      (sum, day) => sum + (day.occupancyPercentage || 0),
      0,
    );
    const averageOccupancy =
      workingDays > 0 ? Math.round(totalOccupancy / workingDays) : 0;

    return {
      totalDays,
      blockedDays,
      workingDays,
      appointmentDays,
      averageOccupancy,
    };
  }, [calendarDays, currentMonth, currentYear]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  }, [currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }, []);

  const setMonth = useCallback((date: Date) => {
    setCurrentMonth(date.getMonth());
    setCurrentYear(date.getFullYear());
  }, []);

  const blockDate = useCallback(
    async (startDate: Date, endDate: Date, reason: string): Promise<boolean> => {
      if (!localId) return false;
      try {
        const createdRanges: BlockedDateRange[] = [];
        const isSameDay =
          startDate.toDateString() === endDate.toDateString();
        const startIsMidnight =
          startDate.getHours() === 0 && startDate.getMinutes() === 0;
        const endIsMidnight =
          endDate.getHours() === 0 && endDate.getMinutes() === 0;

        const formatLocalTime = (d: Date) =>
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        const formatLocalDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (startIsMidnight && endIsMidnight && !isSameDay) {
          const cursor = new Date(startDate);
          while (cursor <= endDate) {
            const dateStr = formatLocalDate(cursor);
            const created = await blockingService.createBlockedDate({
              localId,
              date: dateStr,
              notes: reason,
            });
            const dayStart = new Date(cursor);
            const dayEnd = new Date(cursor);
            createdRanges.push({
              id: created.id,
              startDate: dayStart,
              endDate: dayEnd,
              type: 'full-day',
              reason: created.notes || "",
              localId: created.localId,
              createdAt: created.createdAt,
              updatedAt: created.updatedAt,
            });
            cursor.setDate(cursor.getDate() + 1);
          }
        } else if (isSameDay && (!startIsMidnight || !endIsMidnight)) {
          // Send UTC to backend (the server interprets HH:mm in UTC for time-slots)
          const dateStrUtc = startDate.toISOString().split("T")[0];
          const startTimeUtc = startDate.toISOString().slice(11, 16);
          const endTimeUtc = endDate.toISOString().slice(11, 16);
          const created = await blockingService.createBlockedTimeSlot({
            localId,
            date: dateStrUtc,
            startTime: startTimeUtc,
            endTime: endTimeUtc,
            notes: reason,
          });
          createdRanges.push({
            id: created.id,
            startDate,
            endDate,
            type: 'time-slot',
            startTime: formatLocalTime(startDate),
            endTime: formatLocalTime(endDate),
            reason: created.notes || "",
            localId: created.localId,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
          });
        } else {
          const dateStr = formatLocalDate(startDate);
          const created = await blockingService.createBlockedDate({
            localId,
            date: dateStr,
            notes: reason,
          });
          createdRanges.push({
            id: created.id,
            startDate,
            endDate,
            type: 'full-day',
            reason: created.notes || "",
            localId: created.localId,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
          });
        }

        setBlockedDates((prev) => [...prev, ...createdRanges]);
        return true;
      } catch (err) {
        console.error("Error blocking date:", err);
        return false;
      }
    },
    [localId],
  );

  const unblockDate = useCallback(
    async (blockedDateId: string): Promise<boolean> => {
      if (!localId) return false;
      try {
        const success = await calendarService.unblockDate(
          localId,
          blockedDateId,
        );
        if (success) {
          setBlockedDates((prev) =>
            prev.filter((date) => date.id !== blockedDateId),
          );
        }
        return success;
      } catch (err) {
        console.error("Error unblocking date:", err);
        return false;
      }
    },
    [localId],
  );

  return {
    calendarDays,
    currentMonth,
    currentYear,
    isLoading,
    isRefreshing: isFetching && !isLoading,
    error: error?.message ?? null,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
    setMonth,
    refreshCalendar: refetch,
    blockedDates: blockedDates.length > 0 ? blockedDates : (data?.blockedDates ?? []),
    blockDate,
    unblockDate,
    workingDayTemplates: data?.workingDayTemplates ?? [],
    monthStats,
  };
}
