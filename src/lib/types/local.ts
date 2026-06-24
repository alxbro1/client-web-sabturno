export interface Local {
  id: string;
  name: string;
  email: string;
  province: string;
  city: string;
  address: string;
  phone?: string | null;
  emergencyPhone?: string | null;
  isActive: boolean;
  countryCode?: string;
  timezone?: string;
  imageProfile?: string | null;
  mercadoPagoLiveMode?: boolean;
  payWithReservation?: boolean;
  reservationPercentage?: number | null;
  payWithCashInFront?: boolean;
  payWithTalo?: boolean;
  /** ID del plan de suscripción actual */
  subscriptionPlanId?: string | null;
  /** Tier del plan: basic, pro, enterprise */
  subscriptionTier?: "basic" | "pro" | "enterprise" | null;
  /** Estado de la suscripción */
  subscriptionStatus?: "active" | "trial" | "cancelled" | "expired" | null;
}