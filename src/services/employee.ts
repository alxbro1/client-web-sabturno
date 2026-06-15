import { apiService } from "@/lib/api";
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@/lib/types/employee";

export const employeeService = {
  getEmployees: async (localId: string): Promise<Employee[]> => {
    const response = await apiService.get<Employee[]>(
      `/locals/${localId}/employees`,
    );
    return response.data;
  },

  getEmployee: async (localId: string, id: string): Promise<Employee> => {
    const response = await apiService.get<Employee>(
      `/locals/${localId}/employees/${id}`,
    );
    return response.data;
  },

  createEmployee: async (
    localId: string,
    data: CreateEmployeeRequest,
  ): Promise<Employee> => {
    const response = await apiService.post<Employee>(
      `/locals/${localId}/employees`,
      data,
    );
    return response.data;
  },

  updateEmployee: async (
    localId: string,
    id: string,
    data: UpdateEmployeeRequest,
  ): Promise<Employee> => {
    const response = await apiService.patch<Employee>(
      `/locals/${localId}/employees/${id}`,
      data,
    );
    return response.data;
  },

  deleteEmployee: async (localId: string, id: string): Promise<void> => {
    await apiService.delete(`/locals/${localId}/employees/${id}`);
  },
};
