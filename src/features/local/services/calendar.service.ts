import { apiService } from '@/lib/api';
import { BlockedDateRange, WorkingDayTemplate } from '../types/calendar.types';
import { utcToLocalDate } from '../utils/calendarUtils';

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
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }
    );
    return response.data;
  },
  getAppointmentsByDate: async (localId: string, date: Date): Promise<Appointment[]> => {
    const response = await apiService.get<Appointment[]>(
      `/local/calendar/${localId}/appointments/${date.toISOString().split('T')[0]}`
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
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }
    );
    return response.data.map(item => {
      const start = utcToLocalDate(item.startDate as unknown as string);
      const end = utcToLocalDate(item.endDate as unknown as string);
      if (start.toDateString() !== end.toDateString()) {
        end.setDate(end.getDate() - 1);
      }
      const isTimeSlot = (item.startTime ?? '') < (item.endTime ?? '');
      return { ...item, startDate: start, endDate: end, type: isTimeSlot ? 'time-slot' as const : 'full-day' as const };
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