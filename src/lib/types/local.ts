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
}