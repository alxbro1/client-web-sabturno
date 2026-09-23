import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocalSchedulesPage from "../page";

const { mockTemplates, mockUser } = vi.hoisted(() => ({
  mockTemplates: [] as any[],
  mockUser: { id: "local-1" },
}));

vi.mock("@/hooks/queries/useScheduleTemplatesQuery", () => ({
  useScheduleTemplatesQuery: () => ({
    data: mockTemplates,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockTemplates.length = 0;
});

describe("LocalSchedulesPage - a quien aplica", () => {
  it("muestra 'Todo el local' para una plantilla sin empleado asignado", () => {
    mockTemplates.push({
      id: "tpl-1",
      name: "Horario regular",
      isActive: true,
      timeSlotsCount: 5,
      employeeId: null,
      employeeName: null,
    });

    render(<LocalSchedulesPage />);

    expect(screen.getByText("Todo el local")).toBeInTheDocument();
  });

  it("muestra el nombre del empleado para una plantilla asignada", () => {
    mockTemplates.push({
      id: "tpl-2",
      name: "Turno tarde",
      isActive: true,
      timeSlotsCount: 3,
      employeeId: "emp-1",
      employeeName: "Ana Gomez",
    });

    render(<LocalSchedulesPage />);

    expect(screen.getByText("Ana Gomez")).toBeInTheDocument();
  });
});
