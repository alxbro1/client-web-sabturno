import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocalScheduleEditorPage from "../EditScheduleClient";

const {
  mockGetTemplate,
  mockCreateTemplate,
  mockUpdateTemplate,
  mockPush,
  mockParams,
  mockEmployees,
  mockInvalidateQueries,
} = vi.hoisted(() => ({
  mockGetTemplate: vi.fn(),
  mockCreateTemplate: vi.fn(),
  mockUpdateTemplate: vi.fn(),
  mockPush: vi.fn(),
  mockParams: { id: "new" },
  mockEmployees: [] as any[],
  mockInvalidateQueries: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "local-1" } }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@/hooks/queries/useEmployeesQuery", () => ({
  useEmployeesQuery: () => ({ employees: mockEmployees, isLoading: false }),
}));

vi.mock("@/features/local/services/schedule.service", () => ({
  scheduleService: {
    getTemplate: mockGetTemplate,
    createTemplate: mockCreateTemplate,
    updateTemplate: mockUpdateTemplate,
  },
}));

function fillMinimalValidSchedule() {
  fireEvent.change(screen.getByPlaceholderText("Ej: Horario regular de verano"), {
    target: { value: "Horario regular" },
  });
  // Activa lunes (primer switch de dia) para que la plantilla sea valida.
  const switches = screen.getAllByRole("switch");
  fireEvent.click(switches[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockParams.id = "new";
  mockEmployees.length = 0;
  mockCreateTemplate.mockResolvedValue({ id: "tpl-new" });
  mockUpdateTemplate.mockResolvedValue({ id: "tpl-1" });
});

describe("EditScheduleClient - selector de a quien aplica", () => {
  it("no muestra el selector cuando el local no tiene empleados", () => {
    render(<LocalScheduleEditorPage />);

    expect(screen.queryByText("Aplica a")).not.toBeInTheDocument();
  });

  it("muestra el selector cuando el local tiene empleados", () => {
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });

    render(<LocalScheduleEditorPage />);

    expect(screen.getByText("Aplica a")).toBeInTheDocument();
    expect(screen.getByText("Todo el local")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("envia employeeId al crear cuando se elige un empleado", async () => {
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });

    render(<LocalScheduleEditorPage />);
    fillMinimalValidSchedule();

    fireEvent.change(screen.getByLabelText("Aplica a"), {
      target: { value: "emp-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar plantilla" }));

    await waitFor(() => expect(mockCreateTemplate).toHaveBeenCalledTimes(1));
    expect(mockCreateTemplate.mock.calls[0][0]).toMatchObject({
      employeeId: "emp-1",
    });
  });

  it("precarga el empleado asignado al editar una plantilla existente", async () => {
    mockParams.id = "tpl-1";
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });
    mockGetTemplate.mockResolvedValue({
      id: "tpl-1",
      name: "Turno tarde",
      employeeId: "emp-1",
      timeStockTemplates: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isActive: true },
      ],
    });

    render(<LocalScheduleEditorPage />);

    const select = (await screen.findByLabelText("Aplica a")) as HTMLSelectElement;
    await waitFor(() => expect(select.value).toBe("emp-1"));
  });

  it("muestra el mensaje del backend cuando hay conflicto de plantilla activa (409)", async () => {
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });
    mockCreateTemplate.mockRejectedValue({
      response: {
        status: 409,
        data: { message: "This employee already has an active schedule template" },
      },
    });

    render(<LocalScheduleEditorPage />);
    fillMinimalValidSchedule();
    fireEvent.change(screen.getByLabelText("Aplica a"), {
      target: { value: "emp-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar plantilla" }));

    expect(
      await screen.findByText(
        "Este empleado ya tiene una plantilla de horario activa. Desactivala primero.",
      ),
    ).toBeInTheDocument();
  });
});
