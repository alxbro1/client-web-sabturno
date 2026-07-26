import { apiService } from "@/lib/api";
import type {
  LoyaltyCard,
  LoyaltyDevelopmentCompletion,
  LoyaltyOwnerSummary,
  LoyaltyProgram,
  LoyaltyProgramPayload,
  LoyaltyProgramStatus,
  LoyaltyReward,
  LoyaltyCouponValidation,
} from "@/lib/types/loyalty";

export const loyaltyService = {
  async getOwnerSummary(localId: string) {
    const response = await apiService.get<LoyaltyOwnerSummary>(`/loyalty/local/${localId}`);
    return response.data;
  },

  async saveProgram(localId: string, payload: LoyaltyProgramPayload) {
    const response = await apiService.post<LoyaltyProgram>(
      `/loyalty/local/${localId}/program`,
      payload,
    );
    return response.data;
  },

  async updateProgram(localId: string, payload: Partial<LoyaltyProgramPayload>) {
    const response = await apiService.patch<LoyaltyProgram>(
      `/loyalty/local/${localId}/program`,
      payload,
    );
    return response.data;
  },

  async updateProgramStatus(localId: string, status: LoyaltyProgramStatus) {
    const response = await apiService.patch<LoyaltyProgram>(
      `/loyalty/local/${localId}/program/status/${status}`,
    );
    return response.data;
  },

  async getLocalCards(localId: string) {
    const response = await apiService.get<LoyaltyCard[]>(`/loyalty/local/${localId}/cards`);
    return response.data;
  },

  async adjustCard(localId: string, cardId: string, stamps: number, reason: string) {
    const response = await apiService.post<LoyaltyCard>(
      `/loyalty/local/${localId}/cards/${cardId}/adjust`,
      { stamps, reason },
    );
    return response.data;
  },

  async completeAppointmentForDevelopment(localId: string, appointmentId: number) {
    const response = await apiService.post<LoyaltyDevelopmentCompletion>(
      `/loyalty/local/${localId}/dev/complete-appointment/${appointmentId}`,
    );
    return response.data;
  },

  async getMyCards() {
    const response = await apiService.get<LoyaltyCard[]>("/loyalty/me/cards");
    return response.data;
  },

  async getBookingRewards(params: {
    localId: string;
    serviceId: number;
  }) {
    const response = await apiService.get<LoyaltyReward[]>("/loyalty/booking/rewards", {
      params,
    });
    return response.data;
  },

  async validateBookingCoupon(params: {
    localId: string;
    serviceId: number;
    code: string;
  }) {
    const response = await apiService.post<LoyaltyCouponValidation>(
      "/loyalty/booking/coupon/validate",
      params,
    );
    return response.data;
  },

  async requestGuestLink(localId: string, email: string) {
    await apiService.post("/loyalty/guest/request-link", { localId, email });
    return true;
  },

  async verifyGuestLink(token: string) {
    const response = await apiService.post<{
      localId: string;
      email: string;
      cards: LoyaltyCard[];
    }>("/loyalty/guest/verify", { token });
    return response.data;
  },
};
