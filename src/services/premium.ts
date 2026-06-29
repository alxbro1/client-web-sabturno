import { apiService } from "@/lib/api";
import type {
  PremiumPlan,
  SubscriptionStatus,
  SubscribeRequest,
  SubscribeResponse,
  ChangePlanRequest,
  ChangePlanResponse,
} from "@/lib/types/premium";

export const premiumService = {
  /** Obtener todos los planes disponibles */
  async getPlans(): Promise<PremiumPlan[]> {
    const response = await apiService.get<PremiumPlan[]>("/premium/plans");
    return response.data;
  },

  /** Obtener estado de suscripción del local actual */
  async getStatus(): Promise<SubscriptionStatus> {
    const response = await apiService.get<SubscriptionStatus>("/premium/status");
    return response.data;
  },

  /** Suscribirse a un plan (redirige a MercadoPago) */
  async subscribe(data: SubscribeRequest): Promise<SubscribeResponse> {
    const response = await apiService.post<SubscribeResponse>(
      "/premium/subscribe",
      data,
    );
    return response.data;
  },

  /** Cambiar de plan */
  async changePlan(data: ChangePlanRequest): Promise<ChangePlanResponse> {
    const response = await apiService.post<ChangePlanResponse>(
      "/premium/change-plan",
      data,
    );
    return response.data;
  },

  /** Cancelar renovación automática */
  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    const response = await apiService.post<{ success: boolean; message: string }>(
      "/premium/cancel",
    );
    return response.data;
  },
};
