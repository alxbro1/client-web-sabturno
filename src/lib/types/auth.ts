export interface User {
  id: string;
  name: string;
  email: string;
  isLocal: boolean;
  localName?: string;
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
  payWithTalo?: boolean;
  onboardingCompleted?: boolean;
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
  /** Provincia del local (requerido si isLocal=true) */
  province?: string;
  /** Ciudad del local (requerido si isLocal=true) */
  city?: string;
  /** Direccion del local (requerido si isLocal=true) */
  address?: string;
  // emergencyPhone?: string;
  countryCode?: string;
  timezone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  ok: boolean;
  message: string;
}