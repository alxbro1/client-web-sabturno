import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useMyReportsQuery,
  useReportStatusQuery,
} from "@/hooks/queries/useReportsQuery";
import type { Report } from "@/lib/types/report";
import { ReportReason, ReportStatus } from "@/lib/types/report";

const mockReportService = vi.hoisted(() => ({
  getMyReports: vi.fn(),
  createReport: vi.fn(),
  checkReportStatus: vi.fn(),
}));

vi.mock("@/services/report", () => ({
  reportService: mockReportService,
}));

const LOCAL_ID = "local-1";

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 1,
    localId: LOCAL_ID,
    userId: "user-1",
    reason: ReportReason.SPAM,
    description: "Descripcion del reporte",
    status: ReportStatus.PENDING,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    local: { id: LOCAL_ID, name: "Test Local" },
    ...overrides,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMyReportsQuery", () => {
  it("returns reports from query when successful", async () => {
    const reports = [makeReport({ id: 1 }), makeReport({ id: 2 })];
    mockReportService.getMyReports.mockResolvedValue(reports);

    const { result } = renderHook(() => useMyReportsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reports).toEqual(reports);
    expect(result.current.error).toBeNull();
  });

  it("isLoading is true initially", () => {
    mockReportService.getMyReports.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMyReportsQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns empty array when data is null", async () => {
    mockReportService.getMyReports.mockResolvedValue(null);

    const { result } = renderHook(() => useMyReportsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reports).toEqual([]);
  });

  it("createReport calls reportService.createReport", async () => {
    const newReport = makeReport();
    mockReportService.getMyReports.mockResolvedValue([]);
    mockReportService.createReport.mockResolvedValue(newReport);

    const { result } = renderHook(() => useMyReportsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data = {
      localId: LOCAL_ID,
      reason: ReportReason.SPAM,
      description: "Spam",
    };
    await result.current.createReport(data);

    expect(mockReportService.createReport).toHaveBeenCalledWith(data);
  });

  it("exposes isCreating flag", async () => {
    mockReportService.getMyReports.mockResolvedValue([]);

    const { result } = renderHook(() => useMyReportsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isCreating).toBe(false);
  });
});

describe("useReportStatusQuery", () => {
  it("returns hasReported status", async () => {
    mockReportService.checkReportStatus.mockResolvedValue({
      hasReported: true,
    });

    const { result } = renderHook(() => useReportStatusQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ hasReported: true });
  });

  it("is disabled when localId is empty", () => {
    mockReportService.checkReportStatus.mockResolvedValue({
      hasReported: false,
    });

    renderHook(() => useReportStatusQuery(""), {
      wrapper: createWrapper(),
    });

    expect(mockReportService.checkReportStatus).not.toHaveBeenCalled();
  });
});
