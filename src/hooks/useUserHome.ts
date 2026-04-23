import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { userService } from "@/services/user";
import type { Appointment } from "@/lib/types/booking";
import type { UserDashboardStats, UserHomeData } from "@/lib/types/user";

const INITIAL_STATS: UserDashboardStats = {
  totalAppointments: 0,
  completedAppointments: 0,
  cancelledAppointments: 0,
  monthlySpending: 0,
  favoriteServices: [],
};

export function useUserHome(): UserHomeData {
  const { user } = useAuthStore();
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [dashboardStats, setDashboardStats] = useState<UserDashboardStats>(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!user?.id || user.isLocal) {
      setNextAppointment(null);
      setDashboardStats(INITIAL_STATS);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [nextAppt, stats] = await Promise.allSettled([
        userService.getNextAppointment(user.id),
        userService.getDashboardStats(user.id),
      ]);

      if (nextAppt.status === "fulfilled" && nextAppt.value.id) {
        setNextAppointment(nextAppt.value);
      } else {
        setNextAppointment(null);
      }

      if (stats.status === "fulfilled") {
        setDashboardStats(stats.value);
      } else {
        setDashboardStats(INITIAL_STATS);
      }
    } catch (caughtError) {
      console.error(caughtError);
      setError("No se pudieron cargar tus datos");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.isLocal]);

  useEffect(() => {
    refreshData().catch(console.error);
  }, [refreshData]);

  return {
    nextAppointment,
    dashboardStats,
    isLoading,
    error,
    refreshData,
  };
}