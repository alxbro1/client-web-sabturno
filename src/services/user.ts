import { apiService } from "@/lib/api";
import type { Appointment } from "@/lib/types/booking";
import type { UserDashboardStats, UserPayment } from "@/lib/types/user";

export const userService = {
  async getNextAppointment(userId: string) {
    const response = await apiService.get<Appointment>(`/users/${userId}/next-appointment`);
    return response.data;
  },

  async getRecentAppointments(userId: string, limit = 5) {
    const response = await apiService.get<Appointment[]>(
      `/users/${userId}/appointments/recent?limit=${limit}`,
    );
    return response.data;
  },

  async getUpcomingAppointments(userId: string, limit = 10) {
    const response = await apiService.get<Appointment[]>(
      `/users/${userId}/appointments/upcoming?limit=${limit}`,
    );
    return response.data;
  },

  async getDashboardStats(userId: string) {
    const response = await apiService.get<UserDashboardStats>(`/users/${userId}/dashboard`);
    return response.data;
  },

  async getUserAppointmentsPaginated(
    userId: string,
    options?: {
      cursor?: string;
      statuses?: ("CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED")[];
      limit?: number;
    },
  ) {
    const params = new URLSearchParams();

    if (options?.cursor) {
      params.set("cursor", options.cursor);
    }

    if (options?.statuses?.length) {
      params.set("status", options.statuses.join(","));
    }

    if (options?.limit) {
      params.set("limit", String(options.limit));
    }

    if (options?.statuses?.includes("PENDING")) {
      params.set("minDate", new Date().toISOString());
    }

    const response = await apiService.get<{
      items: Appointment[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/appointments/by-entity/${userId}?${params.toString()}`);

    return response.data;
  },

  async getMyPayments() {
    const response = await apiService.get<UserPayment[] | { items?: UserPayment[] }>("/payments/me");

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.data.items)) {
      return response.data.items;
    }

    return [];
  },
};