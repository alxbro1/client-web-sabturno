import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocalBlockingsPage from "../page";

const { mockCalendarQuery, mockEmployees, mockBlockDate } = vi.hoisted(() => ({
  mockCalendarQuery: {
    blockedDates: [] as any[],
    isLoading: false,
    currentMonth: 0,
    currentYear: 2026,
    setMonth: vi.fn(),
  },
  mockEmployees: [] as any[],
  mockBlockDate: vi.fn(),
}));

vi.mock("@/hooks/queries/useLocalCalendarQuery", () => ({
  useLocalCalendarQuery: (employeeId?: string) => ({
    ...mockCalendarQuery,
    blockDate: mockBlockDate,
    unblockDate: vi.fn(),
    filteredByEmployeeId: employeeId,
  }),
}));

vi.mock("@/hooks/queries/useEmployeesQuery", () => ({
  useEmployeesQuery: () => ({ employees: mockEmployees, isLoading: false }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "local-1" } }),
}));

vi.mock("@/components/shadcn-big-calendar/shadcn-big-calendar", () => ({
  default: () => <div data-testid="calendar-stub" />,
}));

vi.mock("@/components/shadcn-big-calendar/shadcn-big-calendar.css", () => ({}));

function makeBlock(overrides: Record<string, unknown> = {}) {
  return {
    id: "block-1",
    startDate: new Date(2026, 0, 10),
    endDate: new Date(2026, 0, 10),
    type: "full-day" as const,
    reason: "Feriado",
    localId: "local-1",
    employeeId: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCalendarQuery.blockedDates = [];
  mockCalendarQuery.isLoading = false;
  mockEmployees.length = 0;
  mockBlockDate.mockResolvedValue(true);
});

describe("LocalBlockingsPage - selector de empleado", () => {
  it("no muestra selectores cuando el local no tiene empleados", () => {
    render(<LocalBlockingsPage />);

    expect(screen.queryByLabelText("Filtrar por empleado")).not.toBeInTheDocument();
  });

  it("muestra el filtro por empleado cuando el local tiene empleados", () => {
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });

    render(<LocalBlockingsPage />);

    expect(screen.getByLabelText("Filtrar por empleado")).toBeInTheDocument();
  });
});

describe("LocalBlockingsPage - lista de bloqueos", () => {
  it("no muestra badge de empleado cuando el local no tiene empleados", () => {
    mockCalendarQuery.blockedDates = [makeBlock({ employeeId: null })];

    render(<LocalBlockingsPage />);

    expect(screen.queryByText("Todo el local")).not.toBeInTheDocument();
  });

  it("muestra 'Todo el local' en la lista para un bloqueo sin empleado, cuando el local si tiene empleados", () => {
    mockEmployees.push({ id: "emp-1", name: "Ana Gomez", isActive: true });
    mockCalendarQuery.blockedDates = [makeBlock({ employeeId: null })];

    render(<LocalBlockingsPage />);

    const list = screen.getByText("Bloqueos activos (1)").closest("section")!;
    expect(within(list).getByText("Todo el local")).toBeInTheDocument();
  });

  it("muestra el nombre del empleado en la lista para un bloqueo con employeeId", () => {
    mockEmployees.push({ id: "emp-1", name: "Ana Gomez", isActive: true });
    mockCalendarQuery.blockedDates = [makeBlock({ employeeId: "emp-1" })];

    render(<LocalBlockingsPage />);

    const list = screen.getByText("Bloqueos activos (1)").closest("section")!;
    expect(within(list).getByText("Ana Gomez")).toBeInTheDocument();
  });
});
