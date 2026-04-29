import type { Local } from "@/lib/types/local";

export enum PaymentMethod {
  MERCADO_PAGO = "MERCADO_PAGO",
  TRANSFERENCE = "TRANSFERENCE",
  CASH_IN_FRONT = "CASH_IN_FRONT",
  RESERVATION_PAYMENT = "RESERVATION_PAYMENT",
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  cost: number;
  duration: number;
  category: string;
  localId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MercadoPagoCheckoutData {
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  externalReference?: string;
}

export interface CreateAppointmentResponse {
  id: string;
  startDateTime: string;
  endDateTime: string;
  mercadoPago?: MercadoPagoCheckoutData;
  accessHash?: string; // <-- Add this line
}

export type MercadoPagoPaymentStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface PaymentStatusResponse {
  id: string;
  status: MercadoPagoPaymentStatus;
  amount: string;
  mercadoPagoExternalReference?: string | null;
  appointmentId?: number | null;
  updatedAt: string;
}

export interface BookingDTO {
  startDateTime: string;
  serviceId: number;
  userId?: string;
  countryCode?: string;
  timezone?: string;
  paymentMethod?: PaymentMethod;
  email: string;
  userName?: string;
}

export interface Appointment {
  id: number;
  startDateTime: string;
  endDateTime?: string;
  state: "CONFIRMED" | "PENDING" | "CANCELLED" | "COMPLETED";
  status: "confirmed" | "pending" | "cancelled" | "completed";
  service: Service;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  localId: string;
  local: Local;
  price: number;
  createdAt: string;
  updatedAt: string;
  countryCode?: string;
  timezone?: string;
  paymentMethodSelected?: PaymentMethod;
}