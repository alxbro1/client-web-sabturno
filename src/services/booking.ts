import { apiService } from "@/lib/api";
import { useBookingStore } from "@/stores/booking";
import type {
  BookingDTO,
  CreateAppointmentResponse,
  PaymentStatusResponse,
  Service,
  TimeSlot,
} from "@/lib/types/booking";

function withCacheBust(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_cb=${Date.now()}`;
}

export const bookingService = {
  async createAppointment(bookingData: BookingDTO) {
    const response = await apiService.post<CreateAppointmentResponse>("/appointments", bookingData);
    useBookingStore.getState().bumpAvailability();
    return response.data;
  },

  async getAvailableTimeSlots(localId: string, date: string, serviceDuration: number) {
    const params = new URLSearchParams({
      date,
      serviceDuration: String(serviceDuration),
    });

    const response = await apiService.get<TimeSlot[]>(
      withCacheBust(`/time_stock/availability/${localId}?${params.toString()}`),
    );

    return response.data;
  },

  async getServicesByLocal(localId: string) {
    const response = await apiService.get<Service[]>(`/service/bylocal/${localId}`);
    return response.data;
  },

  async getAvailableDays(localId?: string, serviceId?: number) {
    if (!localId || !serviceId) {
      return [];
    }

    const params = new URLSearchParams({ serviceId: String(serviceId) });
    const response = await apiService.get<string[]>(
      withCacheBust(`/time_stock/available-days/${localId}/?${params.toString()}`),
    );
    return response.data;
  },

  async cancelBooking(bookingId: string) {
    await apiService.patch(`/appointments/cancel/${bookingId}`);
    useBookingStore.getState().bumpAvailability();
    return true;
  },

  async getPaymentStatusByExternalReference(externalReference: string) {
    const encodedReference = encodeURIComponent(externalReference);
    const response = await apiService.get<PaymentStatusResponse>(
      `/payments/by-external-reference/${encodedReference}`,
    );
    return response.data;
  },
  async getAppointmentPublic(id: string, hash: string) {
    const response = await apiService.get(`/appointments/${id}/public?hash=${encodeURIComponent(hash)}`);
    return response.data;
  },
};

// Exportar función directa para conveniencia
export const getAppointmentPublic = bookingService.getAppointmentPublic;