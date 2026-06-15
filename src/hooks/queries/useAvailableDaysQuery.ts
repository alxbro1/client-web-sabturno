import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking";
import { queryKeys } from "@/lib/queryKeys";
import { parseDateOnlyToLocal } from "@/lib/utils/date";

export function useAvailableDaysQuery(
  localId: string | null | undefined,
  serviceId: number | null | undefined,
  refreshToken: number,
) {
  return useQuery<Date[], Error>({
    queryKey: queryKeys.availableDays(
      localId ?? "",
      serviceId ?? 0,
      refreshToken,
    ),
    queryFn: async () => {
      const days = await bookingService.getAvailableDays(
        localId!,
        serviceId!,
      );
      return days.map((day) => parseDateOnlyToLocal(day));
    },
    enabled: !!localId && !!serviceId,
    staleTime: 10 * 1000,
  });
}
