import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEmployeesQuery } from "@/hooks/queries/useEmployeesQuery";
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from "@/lib/types/employee";

const mockEmployeeService = vi.hoisted(() => ({
  getEmployees: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
}));

vi.mock("@/services/employee", () => ({
  employeeService: mockEmployeeService,
}));

const LOCAL_ID = "local-1";
const EMPLOYEE_ID = "emp-1";

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
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
  };
}

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

describe("useEmployeesQuery", () => {
  it("returns employees from query when successful", async () => {
    const employees = [makeEmployee({ id: "emp-1" }), makeEmployee({ id: "emp-2" })];
    mockEmployeeService.getEmployees.mockResolvedValue(employees);

    const { result } = renderHook(() => useEmployeesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.employees).toEqual(employees);
    expect(result.current.error).toBeNull();
  });

  it("isLoading is true initially", () => {
    mockEmployeeService.getEmployees.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useEmployeesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns empty array when query returns null", async () => {
    mockEmployeeService.getEmployees.mockResolvedValue(null);

    const { result } = renderHook(() => useEmployeesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.employees).toEqual([]);
  });

  it("is disabled when localId is empty string", () => {
    mockEmployeeService.getEmployees.mockResolvedValue([]);

    const { result } = renderHook(() => useEmployeesQuery(""), {
      wrapper: createWrapper(),
    });

    expect(mockEmployeeService.getEmployees).not.toHaveBeenCalled();
  });

  it("createEmployee calls employeeService.createEmployee", async () => {
    const newEmployee = makeEmployee({ name: "Nuevo" });
    mockEmployeeService.getEmployees.mockResolvedValue([]);
    mockEmployeeService.createEmployee.mockResolvedValue(newEmployee);

    const { result } = renderHook(() => useEmployeesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data: CreateEmployeeRequest = { name: "Nuevo", email: "nuevo@test.com" };
    await result.current.createEmployee(data);

    expect(mockEmployeeService.createEmployee).toHaveBeenCalledWith(
      LOCAL_ID,
      data,
    );
  });

  it("updateEmployee calls employeeService.updateEmployee", async () => {
    mockEmployeeService.getEmployees.mockResolvedValue([]);
    mockEmployeeService.updateEmployee.mockResolvedValue(makeEmployee());

    const { result } = renderHook(() => useEmployeesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data: UpdateEmployeeRequest = { name: "Updated" };
    await result.current.updateEmployee(EMPLOYEE_ID, data);

    expect(mockEmployeeService.updateEmployee).toHaveBeenCalledWith(
      LOCAL_ID,
      EMPLOYEE_ID,
      data,
    );
  });

  it("deleteEmployee calls employeeService.deleteEmployee", async () => {
    mockEmployeeService.getEmployees.mockResolvedValue([]);
    mockEmployeeService.deleteEmployee.mockResolvedValue(undefined);

    const { result } = renderHook(() => useEmployeesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.deleteEmployee(EMPLOYEE_ID);

    expect(mockEmployeeService.deleteEmployee).toHaveBeenCalledWith(
      LOCAL_ID,
      EMPLOYEE_ID,
    );
  });

  it("exposes isCreating, isUpdating, isDeleting during mutations", async () => {
    const employee = makeEmployee();
    mockEmployeeService.getEmployees.mockResolvedValue([employee]);

    const { result } = renderHook(() => useEmployeesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });
});
