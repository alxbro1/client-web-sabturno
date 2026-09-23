import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditEmployeeClient from "../EditEmployeeClient";

const {
  mockCreateEmployee,
  mockUpdateEmployee,
  mockUploadEmployeeImage,
  mockPush,
  mockParams,
  mockEmployees,
  mockServices,
  mockTemplates,
} = vi.hoisted(() => ({
  mockCreateEmployee: vi.fn(),
  mockUpdateEmployee: vi.fn(),
  mockUploadEmployeeImage: vi.fn(),
  mockPush: vi.fn(),
  mockParams: { id: "new" },
  mockEmployees: [] as any[],
  mockServices: [] as any[],
  mockTemplates: [] as any[],
}));

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "local-1" } }),
}));

vi.mock("@/hooks/queries/useEmployeesQuery", () => ({
  useEmployeesQuery: () => ({
    employees: mockEmployees,
    isLoading: false,
    createEmployee: mockCreateEmployee,
    updateEmployee: mockUpdateEmployee,
  }),
}));

vi.mock("@/hooks/queries/useLocalServicesQuery", () => ({
  useLocalServicesQuery: () => ({
    services: mockServices,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/queries/useScheduleTemplatesQuery", () => ({
  useScheduleTemplatesQuery: () => ({
    data: mockTemplates,
    isLoading: false,
  }),
}));

vi.mock("@/services/employee", () => ({
  employeeService: { uploadEmployeeImage: mockUploadEmployeeImage },
}));

// `compressImage` usa <canvas> y el evento load de una <img>, que jsdom no
// implementa: sin este mock la promesa nunca resuelve y el test cuelga.
vi.mock("@/features/local/utils/imageUploadUtils", () => ({
  imageUploadUtils: { compressImage: vi.fn(async (uri: string) => uri) },
}));

function imageFile(name = "foto.png", size = 1024) {
  const file = new File(["x"], name, { type: "image/png" });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function photoInput() {
  return document.getElementById("employee-photo-input") as HTMLInputElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockParams.id = "new";
  mockEmployees.length = 0;
  mockServices.length = 0;
  mockTemplates.length = 0;
  mockCreateEmployee.mockResolvedValue({ id: "emp-new" });
  mockUpdateEmployee.mockResolvedValue({ id: "emp-1" });
  mockUploadEmployeeImage.mockResolvedValue({ avatar: "https://cdn.test/emp-1.jpg" });
});

describe("EditEmployeeClient - servicios", () => {
  it("muestra la ayuda de 'atiende todos' cuando no hay servicios marcados", () => {
    mockServices.push({ id: 1, name: "Corte" }, { id: 2, name: "Color" });

    render(<EditEmployeeClient />);

    expect(
      screen.getByText("Si no marcás ninguno, atiende todos los servicios."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Corte")).not.toBeChecked();
  });

  it("envia serviceIds marcados al crear", async () => {
    mockServices.push({ id: 1, name: "Corte" }, { id: 2, name: "Color" });

    render(<EditEmployeeClient />);

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByLabelText("Corte"));
    fireEvent.click(screen.getByRole("button", { name: "Crear empleado" }));

    await waitFor(() => expect(mockCreateEmployee).toHaveBeenCalledTimes(1));
    expect(mockCreateEmployee.mock.calls[0][0]).toMatchObject({
      name: "Ana",
      serviceIds: [1],
    });
  });
});

describe("EditEmployeeClient - horario asignado", () => {
  it("muestra 'horario del local' cuando el empleado no tiene plantilla propia activa", () => {
    mockParams.id = "emp-1";
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });
    mockTemplates.push({ id: "tpl-1", name: "Local", isActive: true, employeeId: null });

    render(<EditEmployeeClient />);

    expect(screen.getByText(/horario del local/i)).toBeInTheDocument();
  });

  it("muestra el nombre de la plantilla propia cuando el empleado tiene una activa", () => {
    mockParams.id = "emp-1";
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });
    mockTemplates.push(
      { id: "tpl-1", name: "Local", isActive: true, employeeId: null },
      { id: "tpl-2", name: "Turno tarde", isActive: true, employeeId: "emp-1" },
    );

    render(<EditEmployeeClient />);

    expect(screen.getByText(/Turno tarde/)).toBeInTheDocument();
  });
});

describe("EditEmployeeClient - foto", () => {
  it("sube la foto despues de crear un empleado nuevo", async () => {
    render(<EditEmployeeClient />);

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Ana" },
    });
    fireEvent.change(photoInput(), { target: { files: [imageFile()] } });

    await screen.findByText(/imagen nueva/i);

    fireEvent.click(screen.getByRole("button", { name: "Crear empleado" }));

    await waitFor(() => expect(mockCreateEmployee).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockUploadEmployeeImage).toHaveBeenCalledTimes(1));
    expect(mockUploadEmployeeImage.mock.calls[0][0]).toBe("local-1");
    expect(mockUploadEmployeeImage.mock.calls[0][1]).toBe("emp-new");
  });
});
