import { useQuery } from "@tanstack/react-query";
import { employeeService } from "@/services/employee";
import { queryKeys } from "@/lib/queryKeys";
import type { PublicEmployee } from "@/lib/types/employee";

/** Eligible employees for a local+service, for the public booking flow. */
export function usePublicEmployeesQuery(
  localId: string | null | undefined,
  serviceId: number | null | undefined,
) {
  return useQuery<PublicEmployee[], Error>({
    queryKey: queryKeys.publicEmployees(localId ?? "", serviceId ?? 0),
    queryFn: () => employeeService.getPublicEmployees(localId!, serviceId!),
    enabled: !!localId && !!serviceId,
    staleTime: 60 * 1000,
  });
}
