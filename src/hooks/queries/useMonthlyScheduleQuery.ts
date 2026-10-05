"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/useAuth";
import { useLocalQuery } from "@/hooks/queries/useLocalQuery";
import {
  monthlyScheduleService,
  type MonthlyScheduleTemplate,
  type SaveMonthlyScheduleRequest,
} from "@/features/local/services/monthlySchedule.service";

/**
 * Constante a propósito: `listQuery.data ?? []` devolvería un array NUEVO en
 * cada render, y cualquier `useMemo`/`useEffect` que dependa de él cambiaría
 * de identidad siempre. Es la trampa 2 de `AGENTS.md`.
 */
const EMPTY_TEMPLATES: MonthlyScheduleTemplate[] = [];

/**
 * Meses configurados + mutaciones de la plantilla mensual de horarios.
 *
 * `employeeId` es el alcance: `undefined` = todo el local. El listado con
 * `employeeId` devuelve únicamente los meses de ese empleado; sin él devuelve
 * todos los del local y es `findMonthlyScheduleMonth` (exportado por el
 * service) quien se queda con el alcance pedido.
 *
 * El `timezone` del local se usa para convertir el instante UTC de cada día a
 * su clave "YYYY-MM-DD" local. Sin él, un backend en
 * `America/Argentina/Buenos_Aires` y un dispositivo en otra zona muestran el
 * día corrido.
 *
 * `saveMonth` siempre usa `PUT`: el reemplazo transaccional del mes completo
 * también sirve para crear, y de esa forma la pantalla no necesita dos
 * endpoints ni duplicar la invalidación.
 */
export function useMonthlyScheduleQuery(employeeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const localId = user?.id ?? "";
  const { data: local } = useLocalQuery();

  const listQuery = useQuery({
    queryKey: queryKeys.monthlySchedules(localId, employeeId),
    queryFn: () =>
      monthlyScheduleService.listMonths(localId, employeeId, local?.timezone),
    enabled: !!localId && !!user?.isLocal,
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: (data: SaveMonthlyScheduleRequest) =>
      monthlyScheduleService.replaceMonth(
        localId,
        data.year,
        data.month,
        {
          employeeId: data.employeeId ?? null,
          days: data.days,
        },
        local?.timezone,
      ),
    onSuccess: () => {
      invalidateMonthlySchedules(queryClient, localId);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      monthlyScheduleService.removeMonth(localId, year, month),
    onSuccess: () => {
      invalidateMonthlySchedules(queryClient, localId);
    },
  });

  return {
    templates: listQuery.data ?? EMPTY_TEMPLATES,
    isLoading: listQuery.isLoading,
    /** Mensaje de error real, o `null`. Permite distinguir "no configurado" de "falló la request". */
    error: listQuery.error?.message ?? null,
    /** Reintento manual del listado. */
    refetch: listQuery.refetch,
    saveMonth: (data: SaveMonthlyScheduleRequest) =>
      saveMutation.mutateAsync(data),
    removeMonth: (year: number, month: number) =>
      removeMutation.mutateAsync({ year, month }),
    isSaving: saveMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

/**
 * Invalida todos los alcances de la plantilla mensual del local (el prefijo
 * `["monthly-schedules", localId]` matchea también los keys por empleado) y el
 * calendario, porque cambiar los horarios del mes cambia la disponibilidad que
 * ese calendario muestra.
 */
function invalidateMonthlySchedules(
  queryClient: ReturnType<typeof useQueryClient>,
  localId: string,
) {
  queryClient.invalidateQueries({
    queryKey: ["monthly-schedules", localId],
  });
  queryClient.invalidateQueries({ queryKey: ["local-calendar", localId] });
}
