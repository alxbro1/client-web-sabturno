import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { useAuthStore } from "@/stores/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://app-api.sabturno.com";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const requestUrl = config.url ?? "";
  const method = (config.method ?? "get").toLowerCase();

  if (
    method === "get" &&
    (requestUrl.includes("/time_stock/available-days") ||
      requestUrl.includes("/time_stock/availability"))
  ) {
    config.headers = config.headers ?? {};
    config.headers["Cache-Control"] = "no-store, no-cache, max-age=0";
    config.headers.Pragma = "no-cache";
    config.headers.Expires = "0";
  }

  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error Details:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      responseData: error.response?.data,
    });
    return Promise.reject(error);
  },
);

export const apiService = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get(url, config),
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post(url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put(url, data, config),
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch(url, data, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete(url, config),
};