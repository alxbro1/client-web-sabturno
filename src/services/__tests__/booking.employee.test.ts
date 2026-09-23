import { describe, it, expect, vi, beforeEach } from "vitest";
import { bookingService } from "@/services/booking";

const { mockApiService, mockBumpAvailability } = vi.hoisted(() => ({
  mockApiService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  mockBumpAvailability: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiService: mockApiService,
}));

vi.mock("@/stores/booking", () => ({
  useBookingStore: {
    getState: () => ({ bumpAvailability: mockBumpAvailability }),
  },
}));

const LOCAL_ID = "local-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("bookingService.getAvailableTimeSlots with employeeId", () => {
  it("omits employeeId from the query when not provided (no preference / any)", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await bookingService.getAvailableTimeSlots(LOCAL_ID, "2026-10-01", 30);

    const calledUrl = mockApiService.get.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("employeeId");
  });

  it("adds employeeId to the query when a specific employee is chosen", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await bookingService.getAvailableTimeSlots(
      LOCAL_ID,
      "2026-10-01",
      30,
      "emp-1",
    );

    const calledUrl = mockApiService.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain("employeeId=emp-1");
  });

  it("preserves the cache-bust query param alongside employeeId", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await bookingService.getAvailableTimeSlots(
      LOCAL_ID,
      "2026-10-01",
      30,
      "emp-1",
    );

    const calledUrl = mockApiService.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain("_cb=");
  });
});

describe("bookingService.getAvailableDays with employeeId", () => {
  it("omits employeeId from the query when not provided", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await bookingService.getAvailableDays(LOCAL_ID, 10);

    const calledUrl = mockApiService.get.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("employeeId");
  });

  it("adds employeeId to the query when a specific employee is chosen", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await bookingService.getAvailableDays(LOCAL_ID, 10, "emp-1");

    const calledUrl = mockApiService.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain("employeeId=emp-1");
  });

  it("preserves the cache-bust query param alongside employeeId", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await bookingService.getAvailableDays(LOCAL_ID, 10, "emp-1");

    const calledUrl = mockApiService.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain("_cb=");
  });
});
