import { apiService } from "@/lib/api";
import type { Report, CreateReportRequest } from "@/lib/types/report";

export const reportService = {
  createReport: async (data: CreateReportRequest): Promise<Report> => {
    const response = await apiService.post<Report>("/reports/local", data);
    return response.data;
  },

  getMyReports: async (): Promise<Report[]> => {
    const response = await apiService.get<Report[]>("/reports/my-reports");
    return response.data;
  },

  checkReportStatus: async (
    localId: string,
  ): Promise<{ hasReported: boolean }> => {
    const response = await apiService.get<{ hasReported: boolean }>(
      `/reports/local/${localId}/status`,
    );
    return response.data;
  },
};
