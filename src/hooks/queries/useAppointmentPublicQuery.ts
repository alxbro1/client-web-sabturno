import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking";
import { queryKeys } from "@/lib/queryKeys";
import type { AppointmentPublicDetails } from "@/lib/types/booking";

/**
 * Fetches `GET /appointments/:id/public`. `hash` is the guest access hash;
 * when absent (logged-in flow), an empty hash is sent and the backend falls
 * back to validating ownership via the session's bearer token.
 */
export function useAppointmentPublicQuery(
  appointmentId: string | null | undefined,
  hash: string | null | undefined,
) {
  return useQuery<AppointmentPublicDetails, Error>({
    queryKey: queryKeys.appointmentPublic(appointmentId ?? "", hash ?? ""),
    queryFn: () => bookingService.getAppointmentPublic(appointmentId!, hash ?? ""),
    enabled: !!appointmentId,
    staleTime: 0,
    retry: false,
  });
}
