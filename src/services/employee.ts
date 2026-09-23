import { apiService } from "@/lib/api";
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  PublicEmployee,
} from "@/lib/types/employee";

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

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

  /**
   * Sube la foto de perfil del empleado.
   * Endpoint: `POST /locals/:localId/employees/:id/image` (multipart, campo
   * `image`). Mismo patron que `localImagesService.uploadLocalLogo`.
   */
  uploadEmployeeImage: async (
    localId: string,
    id: string,
    imageData: { uri: string },
  ): Promise<Employee | null> => {
    try {
      const formData = new FormData();
      const blob = dataUrlToBlob(imageData.uri);
      const file = new File([blob], "avatar.jpg", { type: blob.type });
      formData.append("image", file);

      const response = await apiService.post<Employee>(
        `/locals/${localId}/employees/${id}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading employee image:", error);
      return null;
    }
  },

  /**
   * Public booking endpoint (no auth). Only eligible employees for the given
   * service, with id/name/color/avatar — never email/phone.
   */
  getPublicEmployees: async (
    localId: string,
    serviceId: number,
  ): Promise<PublicEmployee[]> => {
    const response = await apiService.get<PublicEmployee[]>(
      `/locals/${localId}/employees/public?serviceId=${serviceId}`,
    );
    return response.data;
  },
};
