import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking";
import { queryKeys } from "@/lib/queryKeys";
import { parseDateOnlyToLocal } from "@/lib/utils/date";

export function useAvailableDaysQuery(
  localId: string | null | undefined,
  serviceId: number | null | undefined,
  employeeId: string | "any" | null | undefined,
  refreshToken: number,
) {
  const specificEmployeeId =
    employeeId && employeeId !== "any" ? employeeId : undefined;

  return useQuery<Date[], Error>({
    queryKey: queryKeys.availableDays(
      localId ?? "",
      serviceId ?? 0,
      employeeId ?? "any",
      refreshToken,
    ),
    queryFn: async () => {
      const days = await bookingService.getAvailableDays(
        localId!,
        serviceId!,
        specificEmployeeId,
      );
      return days.map((day) => parseDateOnlyToLocal(day));
    },
    enabled: !!localId && !!serviceId,
    staleTime: 10 * 1000,
  });
}
