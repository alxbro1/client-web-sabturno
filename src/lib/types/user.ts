import type { Appointment } from "@/lib/types/booking";

export interface UserDashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  monthlySpending: number;
  favoriteServices: string[];
}

export interface UserPayment {
  id: string;
  amount: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
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
    local?: {
      id: string;
      name: string;
      city?: string;
    };
  } | null;
}

export interface UserHomeData {
  nextAppointment: Appointment | null;
  dashboardStats: UserDashboardStats;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}