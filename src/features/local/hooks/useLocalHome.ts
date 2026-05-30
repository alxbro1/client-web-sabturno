import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { localService } from '../services/local.service';
import { LocalDashboardStats } from '../types/local.types';
import { Appointment } from '../services/calendar.service';

export interface LocalHomeData {
  nextAppointment: Appointment | null;
  todayAppointments: Appointment[];
  dashboardStats: LocalDashboardStats;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useLocalHome = (): LocalHomeData => {
  const { user } = useAuthStore();
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [dashboardStats, setDashboardStats] = useState<LocalDashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    monthlyRevenue: 0,
    totalClients: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.id || !user?.isLocal) {
      setError('Usuario no es un local válido');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [nextAppt, todayAppts, stats] = await Promise.allSettled([
        localService.getNextAppointment(user.id),
        localService.getTodayAppointments(user.id),
        localService.getDashboardStats(user.id),
      ]);

      if (nextAppt.status === 'fulfilled') {
        setNextAppointment(nextAppt.value ?? null);
      }

      if (todayAppts.status === 'fulfilled') {
        setTodayAppointments(todayAppts.value);
      }

      if (stats.status === 'fulfilled') {
        setDashboardStats(stats.value);
      }

    } catch (err: any) {
      setError(err.message || 'Error cargando datos del local');
      console.error('Error in useLocalHome:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  return {
    nextAppointment,
    todayAppointments,
    dashboardStats,
    isLoading,
    error,
    refreshData: fetchData,
  };
};