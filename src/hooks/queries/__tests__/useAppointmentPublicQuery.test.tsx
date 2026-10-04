import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppointmentPublicQuery } from "@/hooks/queries/useAppointmentPublicQuery";
import type { AppointmentPublicDetails } from "@/lib/types/booking";

const mockBookingService = vi.hoisted(() => ({
  getAppointmentPublic: vi.fn(),
}));

vi.mock("@/services/booking", () => ({
  bookingService: mockBookingService,
}));

const APPOINTMENT_ID = "42";

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

describe("useAppointmentPublicQuery", () => {
  it("fetches the appointment with the guest hash when one is present", async () => {
    const appointment = { id: 42 } as AppointmentPublicDetails;
    mockBookingService.getAppointmentPublic.mockResolvedValue(appointment);

    const { result } = renderHook(
      () => useAppointmentPublicQuery(APPOINTMENT_ID, "guest-hash"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(appointment);
    expect(mockBookingService.getAppointmentPublic).toHaveBeenCalledWith(
      APPOINTMENT_ID,
      "guest-hash",
    );
  });

  it("fetches with an empty hash when none is provided (session-based lookup)", async () => {
    const appointment = { id: 42 } as AppointmentPublicDetails;
    mockBookingService.getAppointmentPublic.mockResolvedValue(appointment);

    const { result } = renderHook(
      () => useAppointmentPublicQuery(APPOINTMENT_ID, null),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockBookingService.getAppointmentPublic).toHaveBeenCalledWith(
      APPOINTMENT_ID,
      "",
    );
  });

  it("is disabled when there is no appointmentId", () => {
    renderHook(() => useAppointmentPublicQuery(null, null), {
      wrapper: createWrapper(),
    });

    expect(mockBookingService.getAppointmentPublic).not.toHaveBeenCalled();
  });

  it("surfaces a fetch failure as isError without throwing", async () => {
    mockBookingService.getAppointmentPublic.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(
      () => useAppointmentPublicQuery(APPOINTMENT_ID, "guest-hash"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
