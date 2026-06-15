import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportService } from "@/services/report";
import type { Report } from "@/lib/types/report";
import { ReportReason, ReportStatus } from "@/lib/types/report";

const { mockApiService } = vi.hoisted(() => ({
  mockApiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  apiService: mockApiService,
}));

const LOCAL_ID = "local-1";

const makeReport = (overrides: Partial<Report> = {}): Report => ({
  id: 1,
  localId: LOCAL_ID,
  userId: "user-1",
  reason: ReportReason.INAPPROPRIATE_CONTENT,
  description: "Contenido inapropiado en el perfil",
  status: ReportStatus.PENDING,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  local: { id: LOCAL_ID, name: "Test Local" },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("reportService.createReport", () => {
  it("makes POST request to /reports/local with data", async () => {
    const data = {
      localId: LOCAL_ID,
      reason: ReportReason.SPAM,
      description: "Spam repetitivo",
    };
    const created = makeReport({
      reason: ReportReason.SPAM,
      description: "Spam repetitivo",
    });
    mockApiService.post.mockResolvedValue({ data: created });

    const result = await reportService.createReport(data);

    expect(mockApiService.post).toHaveBeenCalledTimes(1);
    expect(mockApiService.post).toHaveBeenCalledWith("/reports/local", data);
    expect(result).toEqual(created);
  });
});

describe("reportService.getMyReports", () => {
  it("makes GET request to /reports/my-reports", async () => {
    const reports = [makeReport()];
    mockApiService.get.mockResolvedValue({ data: reports });

    const result = await reportService.getMyReports();

    expect(mockApiService.get).toHaveBeenCalledTimes(1);
    expect(mockApiService.get).toHaveBeenCalledWith("/reports/my-reports");
    expect(result).toEqual(reports);
  });
});

describe("reportService.checkReportStatus", () => {
  it("makes GET request to /reports/local/{localId}/status", async () => {
    const status = { hasReported: true };
    mockApiService.get.mockResolvedValue({ data: status });

    const result = await reportService.checkReportStatus(LOCAL_ID);

    expect(mockApiService.get).toHaveBeenCalledTimes(1);
    expect(mockApiService.get).toHaveBeenCalledWith(
      `/reports/local/${LOCAL_ID}/status`,
    );
    expect(result).toEqual(status);
  });
});
