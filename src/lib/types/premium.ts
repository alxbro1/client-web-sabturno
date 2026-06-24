export type PlanInterval = "monthly" | "yearly";

export type PlanTier = "basic" | "pro" | "enterprise";

export interface PremiumPlan {
  id: string;
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeatures;
  isPopular?: boolean;
}

export interface PlanFeatures {
  /** MercadoPago siempre disponible */
  mercadopago: boolean;
  /** Talo siempre disponible */
  talo: boolean;
  /** Límite de turnos en efectivo por mes (null = ilimitado) */
  cashTurnsLimit: number | null;
  /** Fidelización de clientes */
  loyalty: boolean;
  /** Soporte prioritario */
  prioritySupport: boolean;
  /** Estadísticas avanzadas */
  advancedStats: boolean;
  /** Empleados ilimitados */
  unlimitedEmployees: boolean;
}

export interface SubscriptionStatus {
  /** ID del plan actual */
  currentPlanId: string;
  /** Tier del plan actual */
  tier: PlanTier;
  /** Nombre del plan */
  planName: string;
  /** Intervalo de facturación */
  interval: PlanInterval;
  /** Estado de la suscripción */
  status: "active" | "trial" | "cancelled" | "expired";
  /** Si la suscripción se renueva automáticamente */
  autoRenew: boolean;
  /** Próxima fecha de facturación (ISO) */
  nextBillingDate: string | null;
  /** Fecha de fin del trial (ISO, null si no está en trial) */
  trialEndDate: string | null;
  /** Turnos en efectivo usados este mes */
  cashTurnsUsed: number;
  /** URL del checkout de MercadoPago (null si no aplica) */
  checkoutUrl: string | null;
}

export interface SubscribeRequest {
  planId: string;
  interval: PlanInterval;
}

export interface SubscribeResponse {
  checkoutUrl: string;
  subscriptionId: string;
}

export interface ChangePlanRequest {
  newPlanId: string;
}

export interface ChangePlanResponse {
  success: boolean;
  message: string;
}
