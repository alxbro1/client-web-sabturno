"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { serviceService } from "@/services/service";
import type {
  LocalService,
  CreateServiceRequest,
  UpdateServiceRequest,
} from "@/lib/types/service";

export function useLocalServicesQuery(localId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.localServices(localId),
    queryFn: () => serviceService.getServicesByLocal(localId),
    enabled: !!localId,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceRequest) =>
      serviceService.createService({ ...data, localId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.localServices(localId),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceRequest }) =>
      serviceService.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.localServices(localId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => serviceService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.localServices(localId),
      });
    },
  });

  return {
    services: (query.data ?? []) as LocalService[],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    createService: (data: CreateServiceRequest) =>
      createMutation.mutateAsync(data),
    updateService: (id: number, data: UpdateServiceRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteService: (id: number) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
