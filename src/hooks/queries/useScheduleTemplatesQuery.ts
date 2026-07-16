"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/useAuth";
import { scheduleService } from "@/features/local/services/schedule.service";
import type { ScheduleTemplateFromAPI } from "@/features/local/types/schedule.types";

async function fetchScheduleTemplates(
  localId: string,
): Promise<ScheduleTemplateFromAPI[]> {
  return scheduleService.getTemplates(localId);
}

export function useScheduleTemplatesQuery() {
  const { user } = useAuth();
  const localId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.scheduleTemplates(localId),
    queryFn: () => fetchScheduleTemplates(localId),
    enabled: !!localId && !!user?.isLocal,
    staleTime: 60_000,
  });
}
