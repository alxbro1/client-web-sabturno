import { apiService } from '@/lib/api';
import { BlockedDateRange, WorkingDayTemplate } from '../types/calendar.types';
import { utcToLocalDate } from '../utils/calendarUtils';
import { formatDateOnlyLocal, utcDateTimeToLocalParts } from '@/lib/utils/date';

export interface Appointment {
  id: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  startDateTime: string;
  endDateTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
}

export const calendarService = {
  getCalendarData: async (localId: string, month: number, year: number) => {
    const response = await apiService.get(
      `/local/calendar/${localId}/${year}/${month + 1}`
    );
    return response.data;
  },
  getAppointmentCountByDay: async (
    localId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ [date: string]: number }> => {
    const response = await apiService.get<{ [date: string]: number }>(
      `/local/calendar/${localId}/appointments`, {
        params: {
          startDate: formatDateOnlyLocal(startDate),
          endDate: formatDateOnlyLocal(endDate)
        }
      }
    );
    return response.data;
  },
  getAppointmentsByDate: async (localId: string, date: Date): Promise<Appointment[]> => {
    const response = await apiService.get<Appointment[]>(
      `/local/calendar/${localId}/appointments/${formatDateOnlyLocal(date)}`
    );
    return response.data;
  },
  getBlockedDates: async (
    localId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BlockedDateRange[]> => {
    const response = await apiService.get<BlockedDateRange[]>(
      `/local/calendar/${localId}/blocked-dates`, {
        params: {
          startDate: formatDateOnlyLocal(startDate),
          endDate: formatDateOnlyLocal(endDate)
        }
      }
    );
    return response.data.map(item => {
      const isTimeSlot = (item.startTime ?? '') < (item.endTime ?? '');
      let start = utcToLocalDate(item.startDate as unknown as string);
      let end = utcToLocalDate(item.endDate as unknown as string);
      let startTime = item.startTime;
      let endTime = item.endTime;
      if (isTimeSlot && item.startTime && item.endTime) {
        const startParts = utcDateTimeToLocalParts(item.startDate as unknown as string, item.startTime);
        const [sy, sm, sd] = startParts.date.split("-").map(Number);
        start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        startTime = startParts.time;
        const endParts = utcDateTimeToLocalParts(item.endDate as unknown as string, item.endTime);
        const [ey, em, ed] = endParts.date.split("-").map(Number);
        end = new Date(ey, em - 1, ed, 0, 0, 0, 0);
        endTime = endParts.time;
      }
      if (start.toDateString() !== end.toDateString()) {
        end.setDate(end.getDate() - 1);
      }
      return { ...item, startDate: start, endDate: end, startTime, endTime, type: isTimeSlot ? 'time-slot' as const : 'full-day' as const };
    });
  },
  getWorkingDaysFromTemplates: async (localId: string): Promise<WorkingDayTemplate[]> => {
    const response = await apiService.get<WorkingDayTemplate[]>(
      `/local/calendar/${localId}/working-days`
    );
    return response.data;
  },
  unblockDate: async (localId: string, blockedDateId: string): Promise<boolean> => {
    try {
      await apiService.delete(`/local/calendar/${localId}/blocked-dates/${blockedDateId}`);
      return true;
    } catch {
      return false;
    }
  },
  getCalendarStats: async (localId: string, month: number, year: number) => {
    const response = await apiService.get(
      `/local/calendar/${localId}/stats/${year}/${month + 1}`
    );
    return response.data;
  }
};