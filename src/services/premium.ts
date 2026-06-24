import { apiService } from "@/lib/api";
import type {
  PremiumPlan,
  SubscriptionStatus,
  SubscribeRequest,
  SubscribeResponse,
  ChangePlanRequest,
  ChangePlanResponse,
  PlanTier,
} from "@/lib/types/premium";

/** Normalize backend tier (BASIC/PRO/ENTERPRISE) to lowercase */
function normalizeTier(tier: string): PlanTier {
  const lower = tier.toLowerCase();
  if (lower === "basic" || lower === "pro" || lower === "enterprise") {
    return lower;
  }
  return "basic";
}

export const premiumService = {
  /** Obtener todos los planes disponibles */
  async getPlans(): Promise<PremiumPlan[]> {
    const response = await apiService.get<PremiumPlan[]>("/premium/plans");
    return response.data.map((plan) => ({
      ...plan,
      tier: normalizeTier(plan.tier),
    }));
  },

  /** Obtener estado de suscripción del local actual */
  async getStatus(): Promise<SubscriptionStatus> {
    const response = await apiService.get<SubscriptionStatus>("/premium/status");
    return {
      ...response.data,
      tier: normalizeTier(response.data.tier),
    };
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
