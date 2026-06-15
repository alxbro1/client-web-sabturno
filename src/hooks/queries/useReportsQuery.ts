"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { reportService } from "@/services/report";
import type { CreateReportRequest, Report } from "@/lib/types/report";

export function useMyReportsQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.myReports(),
    queryFn: () => reportService.getMyReports(),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReportRequest) =>
      reportService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myReports(),
      });
    },
  });

  return {
    reports: (query.data ?? []) as Report[],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    createReport: (data: CreateReportRequest) =>
      createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
  };
}

export function useReportStatusQuery(localId: string) {
  return useQuery({
    queryKey: ["report-status", localId],
    queryFn: () => reportService.checkReportStatus(localId),
    enabled: !!localId,
    staleTime: 30_000,
  });
}
