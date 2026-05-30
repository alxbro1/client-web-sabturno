import { apiService } from '@/lib/api';
import { Local, LocalAppointment, LocalDashboardStats } from '../types/local.types';
import { LocalPayment } from '../types/payment.types';
import { Appointment } from './calendar.service';

export interface LocalesPaginated {
  items: Local[];
  nextCursor?: string | null;
  prevCursor?: string | null;
}

export const localService = {
  getLocales: async (params?: { cursor?: string; limit?: number }): Promise<LocalesPaginated> => {
    const query = [];
    if (params?.cursor) query.push(`cursor=${params.cursor}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    const queryString = query.length ? `?${query.join('&')}` : '';
    const response = await apiService.get<LocalesPaginated>(`/local/available${queryString}`);
    return response.data;
  },
  getLocalAppointments: async (localId: string): Promise<LocalAppointment[]> => {
    try {
      const response = await apiService.get<LocalAppointment[]>(`/appointments/local/${localId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching local appointments:', error);
      return [];
    }
  },
  getNextAppointment: async (localId: string): Promise<Appointment | undefined> => {
    try {
      const response = await apiService.get<Appointment>(`/appointments/local/${localId}/next`);
      return response.data;
    } catch (error) {
      console.error('Error fetching next appointment:', error);
    }
  },
  getDashboardStats: async (localId: string): Promise<LocalDashboardStats> => {
    try {
      const response = await apiService.get<LocalDashboardStats>(`/local/${localId}/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        todayAppointments: 0,
        weekAppointments: 0,
        monthlyRevenue: 0,
        totalClients: 0,
      };
    }
  },
  getTodayAppointments: async (localId: string): Promise<Appointment[]> => {
    try {
      const response = await apiService.get<Appointment[]>(`/appointments/local/${localId}/today`);
      return response.data;
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      return [];
    }
  },
  getMyPayments: async (): Promise<LocalPayment[]> => {
    try {
      const response = await apiService.get<LocalPayment[] | { items?: LocalPayment[] }>('/payments/local');

      if (Array.isArray(response.data)) {
        return response.data;
      }

      if (Array.isArray((response.data as any)?.items)) {
        return (response.data as any).items;
      }

      return [];
    } catch (error) {
      console.error('Error fetching local payments:', error);
      return [];
    }
  },
  updateLocal: async (localId: string, data: Partial<Local>): Promise<Local> => {
    const response = await apiService.put<Local>(`/local/${localId}`, data);
    return response.data;
  },
};