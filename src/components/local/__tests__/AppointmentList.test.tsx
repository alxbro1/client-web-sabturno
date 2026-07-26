import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppointmentList } from "@/components/local/AppointmentList";
import { timelineService, type BackendAppointment } from "@/services/timeline";

vi.mock("@/services/timeline", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/timeline")>();
  return {
    ...original,
    timelineService: {
      ...original.timelineService,
      getAppointmentsByEntity: vi.fn(),
    },
  };
});

function makeBackendAppointment(
  overrides: Partial<BackendAppointment> = {},
): BackendAppointment {
  return {
    id: 1,
    startDateTime: "2026-08-10T13:00:00.000Z",
    endDateTime: "2026-08-10T14:00:00.000Z",
    state: "PENDING",
    userName: "Ana",
    email: "ana@example.com",
    phoneNumber: "3515555555",
    serviceId: 1,
    localId: "local-1",
    employeeId: "employee-1",
    timezone: "America/Argentina/Buenos_Aires",
    paymentMethodSelected: "CASH_IN_FRONT",
    countryCode: "AR",
    createdAt: "2026-08-01T12:00:00.000Z",
    updatedAt: "2026-08-01T12:00:00.000Z",
    service: {
      id: 1,
      name: "Corte",
      cost: 8500,
      duration: 60,
    },
    ...overrides,
  };
}

const mockGetAppointments = vi.mocked(timelineService.getAppointmentsByEntity);

describe("AppointmentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppointments.mockResolvedValue({
      items: [makeBackendAppointment()],
      nextCursor: null,
      hasMore: false,
    });
  });

  it("loads upcoming appointments by default and opens a selected item", async () => {
    const onSelect = vi.fn();
    render(
      <AppointmentList
        localId="local-1"
        selectedEmployeeId={null}
        refreshKey={0}
        onSelect={onSelect}
      />,
    );

    expect(await screen.findByText("Ana")).toBeTruthy();
    expect(mockGetAppointments).toHaveBeenCalledWith(
      "local-1",
      expect.objectContaining({
        status: ["PENDING", "CONFIRMED"],
        limit: 10,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Ana/ }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", customerName: "Ana" }),
    );
  });

  it("loads the historical statuses when the tab changes", async () => {
    render(
      <AppointmentList
        localId="local-1"
        selectedEmployeeId={null}
        refreshKey={0}
        onSelect={vi.fn()}
      />,
    );
    await screen.findByText("Ana");

    fireEvent.click(screen.getByRole("tab", { name: "Historial" }));

    await waitFor(() =>
      expect(mockGetAppointments).toHaveBeenLastCalledWith(
        "local-1",
        expect.objectContaining({
          status: ["COMPLETED", "CANCELLED", "CONFIRMED"],
          maxDate: expect.any(String),
        }),
      ),
    );
  });

  it("respects the employee filter", async () => {
    mockGetAppointments.mockResolvedValue({
      items: [
        makeBackendAppointment({ id: 1, userName: "Ana", employeeId: "employee-1" }),
        makeBackendAppointment({ id: 2, userName: "Bruno", employeeId: "employee-2" }),
      ],
      nextCursor: null,
      hasMore: false,
    });

    render(
      <AppointmentList
        localId="local-1"
        selectedEmployeeId="employee-2"
        refreshKey={0}
        onSelect={vi.fn()}
      />,
    );

    expect(await screen.findByText("Bruno")).toBeTruthy();
    expect(screen.queryByText("Ana")).toBeNull();
  });
});
