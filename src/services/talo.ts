import { apiService } from "@/lib/api";
import type { AxiosResponse } from "axios";

export interface TaloPayment {
  id: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount: number;
  currency: string;
  cbu?: string;
  alias?: string;
  aliasCbu?: string;
  expirationTimestamp?: string;
  createdAt: string;
}

export interface TaloStatusResponse {
  connected: boolean;
  payWithTalo?: boolean;
  taloAccountStatus?: string;
}

export const taloService = {
  getStatus: async (localId: string): Promise<TaloStatusResponse> => {
    const response: AxiosResponse<TaloStatusResponse> = await apiService.get(`/talo/status/${localId}`);
    return response.data;
  },

  getPayment: async (paymentId: string): Promise<TaloPayment> => {
    const response: AxiosResponse<TaloPayment> = await apiService.get(`/talo/payments/${paymentId}`);
    return response.data;
  },

  getMyPayments: async (params?: { page?: number; limit?: number }): Promise<{
    items: TaloPayment[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get("/talo/payments", { params });
    return response.data as { items: TaloPayment[]; total: number; page: number; totalPages: number };
  },
};