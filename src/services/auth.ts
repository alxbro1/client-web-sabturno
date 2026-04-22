import {
  DEFAULT_COUNTRY_CODE,
  getDeviceTimezone,
  getValidTimezone,
} from "@/lib/constants/countries";
import { apiService } from "@/lib/api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/lib/types/auth";

export const authService = {
  async login(credentials: LoginRequest) {
    const response = await apiService.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  async register(userData: RegisterRequest) {
    const response = await apiService.post<AuthResponse>("/auth/register", {
      ...userData,
      countryCode: userData.countryCode || DEFAULT_COUNTRY_CODE,
      timezone: getValidTimezone(userData.timezone || getDeviceTimezone()),
    });
    return response.data;
  },

  async logout(userId: string) {
    await apiService.post("/auth/logout", { userId });
  },

  async forgotPassword(email: string) {
    await apiService.post("/auth/forgot-password", { email });
  },
};