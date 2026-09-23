import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocalCalendarQuery } from "@/hooks/queries/useLocalCalendarQuery";

const mockCalendarService = vi.hoisted(() => ({
  getAppointmentCountByDay: vi.fn(),
  getBlockedDates: vi.fn(),
  getWorkingDaysFromTemplates: vi.fn(),
  unblockDate: vi.fn(),
}));

const mockBlockingService = vi.hoisted(() => ({
  createBlockedDate: vi.fn(),
  createBlockedTimeSlot: vi.fn(),
}));

vi.mock("@/features/local/services/calendar.service", () => ({
  calendarService: mockCalendarService,
}));

vi.mock("@/features/local/services/blocking.service", () => ({
  blockingService: mockBlockingService,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "local-1", isLocal: true } }),
}));

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
  mockCalendarService.getAppointmentCountByDay.mockResolvedValue({});
  mockCalendarService.getBlockedDates.mockResolvedValue([]);
  mockCalendarService.getWorkingDaysFromTemplates.mockResolvedValue([]);
});

describe("useLocalCalendarQuery - filtro por empleado", () => {
  it("pasa el employeeId a calendarService.getBlockedDates cuando se indica", async () => {
    const { result } = renderHook(() => useLocalCalendarQuery("emp-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockCalendarService.getBlockedDates).toHaveBeenCalledWith(
      "local-1",
      expect.any(Date),
      expect.any(Date),
      "emp-1",
    );
  });
});

describe("useLocalCalendarQuery - blockDate por empleado", () => {
  it("dia completo: envia employeeId a createBlockedDate", async () => {
    mockBlockingService.createBlockedDate.mockResolvedValue({
      id: "b1",
      localId: "local-1",
      notes: "",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const { result } = renderHook(() => useLocalCalendarQuery(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.blockDate(
        new Date(2026, 0, 5, 0, 0, 0, 0),
        new Date(2026, 0, 5, 0, 0, 0, 0),
        "vacaciones",
        "emp-1",
      );
    });

    expect(mockBlockingService.createBlockedDate).toHaveBeenCalledWith(
      expect.objectContaining({ localId: "local-1", employeeId: "emp-1" }),
    );
  });

  it("franja horaria: envia employeeId a createBlockedTimeSlot", async () => {
    mockBlockingService.createBlockedTimeSlot.mockResolvedValue({
      id: "b2",
      localId: "local-1",
      notes: "",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const { result } = renderHook(() => useLocalCalendarQuery(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.blockDate(
        new Date(2026, 0, 5, 10, 0, 0, 0),
        new Date(2026, 0, 5, 12, 0, 0, 0),
        "corte de luz",
        "emp-1",
      );
    });

    expect(mockBlockingService.createBlockedTimeSlot).toHaveBeenCalledWith(
      expect.objectContaining({ localId: "local-1", employeeId: "emp-1" }),
    );
  });

  it("sin employeeId no lo envia (bloqueo de todo el local)", async () => {
    mockBlockingService.createBlockedDate.mockResolvedValue({
      id: "b3",
      localId: "local-1",
      notes: "",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const { result } = renderHook(() => useLocalCalendarQuery(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.blockDate(
        new Date(2026, 0, 5, 0, 0, 0, 0),
        new Date(2026, 0, 5, 0, 0, 0, 0),
        "feriado",
      );
    });

    const payload = mockBlockingService.createBlockedDate.mock.calls[0][0];
    expect(payload.employeeId).toBeUndefined();
  });
});
