import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocalServicesQuery } from "@/hooks/queries/useLocalServicesQuery";
import type { LocalService, CreateServiceRequest, UpdateServiceRequest } from "@/lib/types/service";

const mockServiceService = vi.hoisted(() => ({
  getServicesByLocal: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
}));

vi.mock("@/services/service", () => ({
  serviceService: mockServiceService,
}));

const LOCAL_ID = "local-1";
const SERVICE_ID = 1;

function makeService(overrides: Partial<LocalService> = {}): LocalService {
  return {
    id: SERVICE_ID,
    name: "Corte de pelo",
    description: "Corte clasico",
    cost: 1500,
    duration: 30,
    category: "PELUQUERIA",
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

describe("useLocalServicesQuery", () => {
  it("returns services from query when successful", async () => {
    const services = [makeService({ id: 1 }), makeService({ id: 2 })];
    mockServiceService.getServicesByLocal.mockResolvedValue(services);

    const { result } = renderHook(() => useLocalServicesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.services).toEqual(services);
    expect(result.current.error).toBeNull();
  });

  it("isLoading is true initially", () => {
    mockServiceService.getServicesByLocal.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useLocalServicesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("is disabled when localId is empty", () => {
    mockServiceService.getServicesByLocal.mockResolvedValue([]);

    renderHook(() => useLocalServicesQuery(""), {
      wrapper: createWrapper(),
    });

    expect(mockServiceService.getServicesByLocal).not.toHaveBeenCalled();
  });

  it("createService calls serviceService.createService with merged localId", async () => {
    mockServiceService.getServicesByLocal.mockResolvedValue([]);
    mockServiceService.createService.mockResolvedValue(makeService());

    const { result } = renderHook(() => useLocalServicesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data: CreateServiceRequest = {
      name: "Nuevo servicio",
      cost: 2000,
      duration: 45,
      localId: LOCAL_ID,
    };
    await result.current.createService(data);

    expect(mockServiceService.createService).toHaveBeenCalledWith(data);
  });

  it("updateService calls serviceService.updateService", async () => {
    mockServiceService.getServicesByLocal.mockResolvedValue([]);
    mockServiceService.updateService.mockResolvedValue(makeService());

    const { result } = renderHook(() => useLocalServicesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data: UpdateServiceRequest = { cost: 2500 };
    await result.current.updateService(SERVICE_ID, data);

    expect(mockServiceService.updateService).toHaveBeenCalledWith(
      SERVICE_ID,
      data,
    );
  });

  it("deleteService calls serviceService.deleteService", async () => {
    mockServiceService.getServicesByLocal.mockResolvedValue([]);
    mockServiceService.deleteService.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLocalServicesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.deleteService(SERVICE_ID);

    expect(mockServiceService.deleteService).toHaveBeenCalledWith(SERVICE_ID);
  });

  it("exposes isCreating, isUpdating, isDeleting flags", async () => {
    mockServiceService.getServicesByLocal.mockResolvedValue([]);

    const { result } = renderHook(() => useLocalServicesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });
});
