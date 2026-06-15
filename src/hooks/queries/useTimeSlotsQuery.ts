import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking";
import { queryKeys } from "@/lib/queryKeys";
import { formatDateOnlyLocal } from "@/lib/utils/date";
import type { TimeSlot } from "@/lib/types/booking";

export function useTimeSlotsQuery(
  localId: string | null | undefined,
  selectedDate: Date | null,
  serviceDuration: number | null | undefined,
  refreshToken: number,
) {
  const dateStr = selectedDate ? formatDateOnlyLocal(selectedDate) : null;

  return useQuery<TimeSlot[], Error>({
    queryKey: queryKeys.timeSlots(
      localId ?? "",
      dateStr ?? "",
      serviceDuration ?? 0,
      refreshToken,
    ),
    queryFn: () =>
      bookingService.getAvailableTimeSlots(localId!, dateStr!, serviceDuration!),
    enabled: !!localId && !!dateStr && !!serviceDuration,
    staleTime: 10 * 1000,
  });
}
