import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "@/services/booking";
import { useBookingStore } from "@/stores/booking";
import type { BookingDTO, CreateAppointmentResponse } from "@/lib/types/booking";

export function useCreateAppointmentMutation() {
  const queryClient = useQueryClient();
  const resetBooking = useBookingStore((s) => s.resetBooking);

  return useMutation<CreateAppointmentResponse, Error, BookingDTO>({
    mutationFn: (data) => bookingService.createAppointment(data),
    onSuccess: () => {
      resetBooking();
      queryClient.invalidateQueries({ queryKey: ["available-days"] });
      queryClient.invalidateQueries({ queryKey: ["time-slots"] });
    },
  });
}
