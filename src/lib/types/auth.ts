export interface User {
  id: string;
  name: string;
  email: string;
  isLocal: boolean;
  localId?: string;
  phone: string;
  province?: string;
  address?: string;
  city?: string;
  imageProfile?: string;
  countryCode?: string;
  timezone?: string;
  birthDate?: string;
  mercadoPagoLiveMode?: boolean;
  payWithReservation?: boolean;
  reservationPercentage?: number | null;
  payWithCashInFront?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  isLocal: boolean;
  countryCode?: string;
  timezone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}