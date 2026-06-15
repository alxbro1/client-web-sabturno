import { describe, it, expect, vi, beforeEach } from "vitest";
import { employeeService } from "@/services/employee";
import type { Employee } from "@/lib/types/employee";

const { mockApiService } = vi.hoisted(() => ({
  mockApiService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  apiService: mockApiService,
}));

const LOCAL_ID = "local-1";
const EMPLOYEE_ID = "emp-1";

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: EMPLOYEE_ID,
  name: "Juan Perez",
  email: "juan@example.com",
  phone: "123456789",
  color: "#00f068",
  isActive: true,
  localId: LOCAL_ID,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("employeeService.getEmployees", () => {
  it("makes GET request to /locals/{localId}/employees", async () => {
    const employees = [makeEmployee()];
    mockApiService.get.mockResolvedValue({ data: employees });

    const result = await employeeService.getEmployees(LOCAL_ID);

    expect(mockApiService.get).toHaveBeenCalledTimes(1);
    expect(mockApiService.get).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/employees`,
    );
    expect(result).toEqual(employees);
  });
});

describe("employeeService.getEmployee", () => {
  it("makes GET request to /locals/{localId}/employees/{id}", async () => {
    const employee = makeEmployee();
    mockApiService.get.mockResolvedValue({ data: employee });

    const result = await employeeService.getEmployee(LOCAL_ID, EMPLOYEE_ID);

    expect(mockApiService.get).toHaveBeenCalledTimes(1);
    expect(mockApiService.get).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/employees/${EMPLOYEE_ID}`,
    );
    expect(result).toEqual(employee);
  });
});

describe("employeeService.createEmployee", () => {
  it("makes POST request to /locals/{localId}/employees with data", async () => {
    const data = { name: "Nuevo Empleado", email: "nuevo@example.com" };
    const created = makeEmployee({ name: "Nuevo Empleado", email: "nuevo@example.com" });
    mockApiService.post.mockResolvedValue({ data: created });

    const result = await employeeService.createEmployee(LOCAL_ID, data);

    expect(mockApiService.post).toHaveBeenCalledTimes(1);
    expect(mockApiService.post).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/employees`,
      data,
    );
    expect(result).toEqual(created);
  });
});

describe("employeeService.updateEmployee", () => {
  it("makes PATCH request to /locals/{localId}/employees/{id} with data", async () => {
    const data = { name: "Updated Name" };
    const updated = makeEmployee({ name: "Updated Name" });
    mockApiService.patch.mockResolvedValue({ data: updated });

    const result = await employeeService.updateEmployee(LOCAL_ID, EMPLOYEE_ID, data);

    expect(mockApiService.patch).toHaveBeenCalledTimes(1);
    expect(mockApiService.patch).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/employees/${EMPLOYEE_ID}`,
      data,
    );
    expect(result).toEqual(updated);
  });
});

describe("employeeService.deleteEmployee", () => {
  it("makes DELETE request to /locals/{localId}/employees/{id}", async () => {
    mockApiService.delete.mockResolvedValue({ data: undefined });

    await employeeService.deleteEmployee(LOCAL_ID, EMPLOYEE_ID);

    expect(mockApiService.delete).toHaveBeenCalledTimes(1);
    expect(mockApiService.delete).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/employees/${EMPLOYEE_ID}`,
    );
  });
});
