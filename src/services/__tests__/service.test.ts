import { describe, it, expect, vi, beforeEach } from "vitest";
import { serviceService } from "@/services/service";
import type { LocalService } from "@/lib/types/service";

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
const SERVICE_ID = 1;

const makeService = (overrides: Partial<LocalService> = {}): LocalService => ({
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
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("serviceService.getServicesByLocal", () => {
  it("makes GET request to /service/bylocal/{localId}", async () => {
    const services = [makeService()];
    mockApiService.get.mockResolvedValue({ data: services });

    const result = await serviceService.getServicesByLocal(LOCAL_ID);

    expect(mockApiService.get).toHaveBeenCalledTimes(1);
    expect(mockApiService.get).toHaveBeenCalledWith(
      `/service/bylocal/${LOCAL_ID}`,
    );
    expect(result).toEqual(services);
  });
});

describe("serviceService.getService", () => {
  it("makes GET request to /service/{id}", async () => {
    const service = makeService();
    mockApiService.get.mockResolvedValue({ data: service });

    const result = await serviceService.getService(SERVICE_ID);

    expect(mockApiService.get).toHaveBeenCalledTimes(1);
    expect(mockApiService.get).toHaveBeenCalledWith(`/service/${SERVICE_ID}`);
    expect(result).toEqual(service);
  });
});

describe("serviceService.createService", () => {
  it("makes POST request to /service with data", async () => {
    const data = {
      name: "Nuevo servicio",
      cost: 2000,
      duration: 45,
      localId: LOCAL_ID,
    };
    const created = makeService({
      name: "Nuevo servicio",
      cost: 2000,
      duration: 45,
    });
    mockApiService.post.mockResolvedValue({ data: created });

    const result = await serviceService.createService(data);

    expect(mockApiService.post).toHaveBeenCalledTimes(1);
    expect(mockApiService.post).toHaveBeenCalledWith("/service", data);
    expect(result).toEqual(created);
  });
});

describe("serviceService.updateService", () => {
  it("makes PATCH request to /service/{id} with data", async () => {
    const data = { cost: 2500 };
    const updated = makeService({ cost: 2500 });
    mockApiService.patch.mockResolvedValue({ data: updated });

    const result = await serviceService.updateService(SERVICE_ID, data);

    expect(mockApiService.patch).toHaveBeenCalledTimes(1);
    expect(mockApiService.patch).toHaveBeenCalledWith(
      `/service/${SERVICE_ID}`,
      data,
    );
    expect(result).toEqual(updated);
  });
});

describe("serviceService.deleteService", () => {
  it("makes DELETE request to /service/{id}", async () => {
    mockApiService.delete.mockResolvedValue({ data: undefined });

    await serviceService.deleteService(SERVICE_ID);

    expect(mockApiService.delete).toHaveBeenCalledTimes(1);
    expect(mockApiService.delete).toHaveBeenCalledWith(`/service/${SERVICE_ID}`);
  });
});
