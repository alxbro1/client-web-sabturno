"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { employeeService } from "@/services/employee";
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@/lib/types/employee";

export function useEmployeesQuery(localId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.employees(localId),
    queryFn: () => employeeService.getEmployees(localId),
    enabled: !!localId,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeRequest) =>
      employeeService.createEmployee(localId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees(localId),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) =>
      employeeService.updateEmployee(localId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees(localId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(localId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees(localId),
      });
    },
  });

  return {
    employees: (query.data ?? []) as Employee[],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    createEmployee: (data: CreateEmployeeRequest) =>
      createMutation.mutateAsync(data),
    updateEmployee: (id: string, data: UpdateEmployeeRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteEmployee: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
