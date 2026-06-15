import { apiService } from "@/lib/api";
import type {
  LocalService,
  CreateServiceRequest,
  UpdateServiceRequest,
} from "@/lib/types/service";

export const serviceService = {
  getServicesByLocal: async (localId: string): Promise<LocalService[]> => {
    const response = await apiService.get<LocalService[]>(
      `/service/bylocal/${localId}`,
    );
    return response.data;
  },

  getService: async (id: number): Promise<LocalService> => {
    const response = await apiService.get<LocalService>(`/service/${id}`);
    return response.data;
  },

  createService: async (data: CreateServiceRequest): Promise<LocalService> => {
    const response = await apiService.post<LocalService>("/service", data);
    return response.data;
  },

  updateService: async (
    id: number,
    data: UpdateServiceRequest,
  ): Promise<LocalService> => {
    const response = await apiService.patch<LocalService>(
      `/service/${id}`,
      data,
    );
    return response.data;
  },

  deleteService: async (id: number): Promise<void> => {
    await apiService.delete(`/service/${id}`);
  },
};
