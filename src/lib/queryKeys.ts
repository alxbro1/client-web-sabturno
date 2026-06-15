export const queryKeys = {
  locals: () => ["locals"] as const,
  localsAvailable: (limit?: number) => ["locals", "available", limit] as const,
  services: (localId: string) => ["services", localId] as const,
  availableDays: (localId: string, serviceId: number, refreshToken: number) =>
    ["available-days", localId, serviceId, refreshToken] as const,
  timeSlots: (
    localId: string,
    date: string,
    serviceDuration: number,
    refreshToken: number,
  ) => ["time-slots", localId, date, serviceDuration, refreshToken] as const,
  taloStatus: (localId: string) => ["talo-status", localId] as const,
  paymentStatus: (externalReference: string, taloPaymentId: string) =>
    ["payment-status", externalReference, taloPaymentId] as const,
  localHome: (localId: string) => ["local-home", localId] as const,
  scheduleTemplates: (localId: string) => ["schedule-templates", localId] as const,
  localCalendar: (localId: string, month: number, year: number) =>
    ["local-calendar", localId, month, year] as const,
  localImages: (localId: string) => ["local-images", localId] as const,
  userPayments: () => ["user-payments"] as const,
};
