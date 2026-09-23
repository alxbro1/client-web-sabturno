import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTimeSlotsQuery } from "@/hooks/queries/useTimeSlotsQuery";

const mockBookingService = vi.hoisted(() => ({
  getAvailableTimeSlots: vi.fn(),
}));

vi.mock("@/services/booking", () => ({
  bookingService: mockBookingService,
}));

const LOCAL_ID = "local-1";
const SELECTED_DATE = new Date(2026, 9, 1);
const DURATION = 30;

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

describe("useTimeSlotsQuery", () => {
  it("does not pass an employeeId to the service when 'any' or null is given", async () => {
    mockBookingService.getAvailableTimeSlots.mockResolvedValue([]);

    renderHook(
      () => useTimeSlotsQuery(LOCAL_ID, SELECTED_DATE, DURATION, "any", 0),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(mockBookingService.getAvailableTimeSlots).toHaveBeenCalled(),
    );
    expect(mockBookingService.getAvailableTimeSlots).toHaveBeenCalledWith(
      LOCAL_ID,
      "2026-10-01",
      DURATION,
      undefined,
    );
  });

  it("passes a specific employeeId to the service", async () => {
    mockBookingService.getAvailableTimeSlots.mockResolvedValue([]);

    renderHook(
      () => useTimeSlotsQuery(LOCAL_ID, SELECTED_DATE, DURATION, "emp-1", 0),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(mockBookingService.getAvailableTimeSlots).toHaveBeenCalled(),
    );
    expect(mockBookingService.getAvailableTimeSlots).toHaveBeenCalledWith(
      LOCAL_ID,
      "2026-10-01",
      DURATION,
      "emp-1",
    );
  });
});
