import { describe, it, expect, vi, beforeEach } from "vitest";
import { calendarService } from "@/features/local/services/calendar.service";

const { mockApiService } = vi.hoisted(() => ({
  mockApiService: { get: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/lib/api", () => ({ apiService: mockApiService }));

const LOCAL_ID = "local-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("calendarService.getBlockedDates", () => {
  it("passes employeeId as a query param when provided", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await calendarService.getBlockedDates(
      LOCAL_ID,
      new Date(2026, 0, 1),
      new Date(2026, 0, 31),
      "emp-1",
    );

    expect(mockApiService.get).toHaveBeenCalledWith(
      `/local/calendar/${LOCAL_ID}/blocked-dates`,
      {
        params: {
          startDate: "2026-01-01",
          endDate: "2026-01-31",
          employeeId: "emp-1",
        },
      },
    );
  });

  it("omits employeeId from params when not provided", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await calendarService.getBlockedDates(
      LOCAL_ID,
      new Date(2026, 0, 1),
      new Date(2026, 0, 31),
    );

    const params = mockApiService.get.mock.calls[0][1].params;
    expect(params).not.toHaveProperty("employeeId");
  });

  it("maps employeeId through from the backend response", async () => {
    mockApiService.get.mockResolvedValue({
      data: [
        {
          id: "block-1",
          startDate: "2026-01-05T00:00:00.000Z",
          endDate: "2026-01-05T00:00:00.000Z",
          startTime: undefined,
          endTime: undefined,
          employeeId: "emp-1",
          notes: "vacaciones",
          localId: LOCAL_ID,
        },
      ],
    });

    const result = await calendarService.getBlockedDates(
      LOCAL_ID,
      new Date(2026, 0, 1),
      new Date(2026, 0, 31),
    );

    expect(result[0].employeeId).toBe("emp-1");
  });
});
