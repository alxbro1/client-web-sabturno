export type LocalPaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface LocalPayment {
  id: string;
  amount: string;
  status: LocalPaymentStatus;
  method: string;
  appointmentId: number | null;
  mercadoPagoExternalReference?: string | null;
  createdAt: string;
  appointment?: {
    id: number;
    startDateTime: string;
    service?: {
      id: number;
      name: string;
      cost: number;
    };
    user?: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    };
  } | null;
}