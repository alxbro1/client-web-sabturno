import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePublicEmployeesQuery } from "@/hooks/queries/usePublicEmployeesQuery";
import type { PublicEmployee } from "@/lib/types/employee";

const mockEmployeeService = vi.hoisted(() => ({
  getPublicEmployees: vi.fn(),
}));

vi.mock("@/services/employee", () => ({
  employeeService: mockEmployeeService,
}));

const LOCAL_ID = "local-1";
const SERVICE_ID = 10;

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

describe("usePublicEmployeesQuery", () => {
  it("returns eligible employees for the local and service", async () => {
    const employees: PublicEmployee[] = [
      { id: "emp-1", name: "Juan", color: "#00f068", avatar: null },
    ];
    mockEmployeeService.getPublicEmployees.mockResolvedValue(employees);

    const { result } = renderHook(
      () => usePublicEmployeesQuery(LOCAL_ID, SERVICE_ID),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(employees);
    expect(mockEmployeeService.getPublicEmployees).toHaveBeenCalledWith(
      LOCAL_ID,
      SERVICE_ID,
    );
  });

  it("is disabled when localId or serviceId is missing", () => {
    renderHook(() => usePublicEmployeesQuery(null, null), {
      wrapper: createWrapper(),
    });

    expect(mockEmployeeService.getPublicEmployees).not.toHaveBeenCalled();
  });
});
