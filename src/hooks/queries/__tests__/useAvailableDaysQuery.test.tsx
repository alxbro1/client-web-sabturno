import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAvailableDaysQuery } from "@/hooks/queries/useAvailableDaysQuery";

const mockBookingService = vi.hoisted(() => ({
  getAvailableDays: vi.fn(),
}));

vi.mock("@/services/booking", () => ({
  bookingService: mockBookingService,
}));

const LOCAL_ID = "local-1";
const SERVICE_ID = 10;

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

describe("useAvailableDaysQuery", () => {
  it("does not pass an employeeId to the service when 'any' or null is given", async () => {
    mockBookingService.getAvailableDays.mockResolvedValue([]);

    renderHook(() => useAvailableDaysQuery(LOCAL_ID, SERVICE_ID, "any", 0), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(mockBookingService.getAvailableDays).toHaveBeenCalled(),
    );
    expect(mockBookingService.getAvailableDays).toHaveBeenCalledWith(
      LOCAL_ID,
      SERVICE_ID,
      undefined,
    );
  });

  it("passes a specific employeeId to the service", async () => {
    mockBookingService.getAvailableDays.mockResolvedValue([]);

    renderHook(
      () => useAvailableDaysQuery(LOCAL_ID, SERVICE_ID, "emp-1", 0),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(mockBookingService.getAvailableDays).toHaveBeenCalled(),
    );
    expect(mockBookingService.getAvailableDays).toHaveBeenCalledWith(
      LOCAL_ID,
      SERVICE_ID,
      "emp-1",
    );
  });

  it("uses a different query key per employeeId (cache isolation)", async () => {
    mockBookingService.getAvailableDays.mockResolvedValue([]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    }

    renderHook(() => useAvailableDaysQuery(LOCAL_ID, SERVICE_ID, "emp-1", 0), {
      wrapper: Wrapper,
    });
    renderHook(() => useAvailableDaysQuery(LOCAL_ID, SERVICE_ID, "emp-2", 0), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(mockBookingService.getAvailableDays).toHaveBeenCalledTimes(2),
    );
  });
});
