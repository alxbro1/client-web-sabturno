import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking";
import { queryKeys } from "@/lib/queryKeys";
import type { Service } from "@/lib/types/booking";

export function useServicesQuery(localId: string | null | undefined) {
  return useQuery<Service[], Error>({
    queryKey: queryKeys.services(localId ?? ""),
    queryFn: () => bookingService.getServicesByLocal(localId!),
    enabled: !!localId,
    staleTime: 60 * 1000,
    select: (services) => services.filter((s) => s.isActive),
  });
}
