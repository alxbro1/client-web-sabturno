import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockQuery, mockUser } = vi.hoisted(() => ({
  mockQuery: {
    employees: [] as Array<{ id: string; name: string; email?: string; phone?: string; color?: string }>,
    isLoading: false,
    error: null as string | null,
    deleteEmployee: vi.fn(),
  },
  mockUser: { id: "local-1" },
}));

vi.mock("@/hooks/queries/useEmployeesQuery", () => ({
  useEmployeesQuery: () => ({
    employees: mockQuery.employees,
    isLoading: mockQuery.isLoading,
    error: mockQuery.error,
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: mockQuery.deleteEmployee,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    hasHydrated: true,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import EmployeesPage from "@/app/(local)/local/employees/page";
import type { ReactNode } from "react";

beforeEach(() => {
  vi.clearAllMocks();
  mockQuery.employees = [];
  mockQuery.isLoading = false;
  mockQuery.error = null;
  mockQuery.deleteEmployee.mockResolvedValue(undefined);
});

describe("EmployeesPage", () => {
  it("shows loading state", () => {
    mockQuery.isLoading = true;

    render(<EmployeesPage />);

    expect(screen.getByText("Cargando empleados...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockQuery.error = "Error al cargar empleados";

    render(<EmployeesPage />);

    expect(screen.getByText("Error al cargar empleados")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<EmployeesPage />);

    expect(screen.getByText("No hay empleados registrados")).toBeInTheDocument();
    expect(screen.getByText("Agregar primer empleado")).toBeInTheDocument();
  });

  it("renders employee list", () => {
    mockQuery.employees = [
      { id: "1", name: "Juan Perez", email: "juan@test.com", color: "#00f068" },
      { id: "2", name: "Maria Garcia", phone: "123456789", color: "#7bcfff" },
    ];

    render(<EmployeesPage />);

    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("juan@test.com")).toBeInTheDocument();
    expect(screen.getByText("Maria Garcia")).toBeInTheDocument();
    expect(screen.getByText("123456789")).toBeInTheDocument();
  });

  it("opens confirm dialog on delete click", async () => {
    const user = userEvent.setup();
    mockQuery.employees = [{ id: "1", name: "Juan Perez", color: "#00f068" }];

    render(<EmployeesPage />);

    const deleteButton = screen.getByText("Eliminar");
    await user.click(deleteButton);

    expect(screen.getByText("Eliminar empleado")).toBeInTheDocument();
    expect(screen.getByText(/Esta accion no se puede deshacer/i)).toBeInTheDocument();
  });

  it("calls deleteEmployee on confirm", async () => {
    const user = userEvent.setup();
    mockQuery.employees = [{ id: "1", name: "Juan Perez", color: "#00f068" }];

    render(<EmployeesPage />);

    const deleteButton = screen.getByText("Eliminar");
    await user.click(deleteButton);

    const dialogButtons = screen.getAllByText("Eliminar");
    await user.click(dialogButtons[dialogButtons.length - 1]);

    await waitFor(() => {
      expect(mockQuery.deleteEmployee).toHaveBeenCalledWith("1");
    });
  });
});
