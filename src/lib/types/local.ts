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
  /**
   * When true, the business receives a WhatsApp message on `phone` every time
   * a client books an appointment. The backend rejects enabling it without a
   * valid mobile `phone` (400).
   */
  notifyNewAppointmentWhatsapp?: boolean;
  /** ID del plan de suscripción actual */
  subscriptionPlanId?: string | null;
  /** Tier del plan: basic, pro, enterprise */
  subscriptionTier?: "basic" | "pro" | "enterprise" | null;
  /** Estado de la suscripción */
  subscriptionStatus?: "active" | "trial" | "cancelled" | "expired" | null;
  onboardingCompleted?: boolean;
  /**
   * Bare Instagram handle (no `@`, no URL) — normalized and validated by the
   * backend (`local-instagram.util.ts`). `null`/absent means no Instagram set.
   */
  instagram?: string | null;
  /**
   * Only present on `GET /local/available` items (`findAvailableLocals`).
   * Already filtered server-side to active templates with an active
   * `scheduleTemplate`, so every entry here is currently in effect.
   */
  timeStockTemplates?: TimeStockTemplateEntry[];
}

/**
 * Minimal projection of `TimeStockTemplate` as embedded in `/local/available`
 * items (`backend/src/local/local.repository.ts` → `findAvailableLocals`).
 * `dayOfWeek`: 0 = Sunday … 6 = Saturday. `startTime`/`endTime`: `"HH:mm"`
 * strings — see `docs/time-handling.md`.
 */
export interface TimeStockTemplateEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

/**
 * `GET /local/:id/public-images` — public, unauthenticated, ordered list of
 * a local's active LOGO / COVER_IMAGE / GALLERY_IMAGE rows. `id` is a bare
 * Prisma `Image.id` (`Int`, autoincrement) — verified live against the dev
 * backend, not `string` as a first draft of this contract assumed.
 */
export interface PublicLocalImage {
  id: number;
  url: string;
  type: "LOGO" | "COVER_IMAGE" | "GALLERY_IMAGE";
  order: number;
}