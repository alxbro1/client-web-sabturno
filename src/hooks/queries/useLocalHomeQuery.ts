"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/auth";
import { localService } from "@/features/local/services/local.service";
import type { LocalDashboardStats } from "@/features/local/types/local.types";
import type { Appointment } from "@/features/local/services/calendar.service";

export interface LocalHomeData {
  nextAppointment: Appointment | null;
  todayAppointments: Appointment[];
  dashboardStats: LocalDashboardStats;
}

async function fetchLocalHome(localId: string): Promise<LocalHomeData> {
  const [nextAppt, todayAppts, stats] = await Promise.allSettled([
    localService.getNextAppointment(localId),
    localService.getTodayAppointments(localId),
    localService.getDashboardStats(localId),
  ]);

  return {
    nextAppointment:
      nextAppt.status === "fulfilled" ? (nextAppt.value ?? null) : null,
    todayAppointments:
      todayAppts.status === "fulfilled" ? todayAppts.value : [],
    dashboardStats:
      stats.status === "fulfilled"
        ? stats.value
        : {
            todayAppointments: 0,
            weekAppointments: 0,
            monthlyRevenue: 0,
            totalClients: 0,
          },
  };
}

export function useLocalHomeQuery() {
  const { user } = useAuthStore();
  const localId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.localHome(localId),
    queryFn: () => fetchLocalHome(localId),
    enabled: !!localId && !!user?.isLocal,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
