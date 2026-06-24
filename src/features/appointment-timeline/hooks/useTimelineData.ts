import { useState, useEffect, useCallback } from 'react';
import { timelineService, type BackendEmployee } from '@/services/timeline';
import { mapBackendAppointments, mapBackendTimeStocks, formatDateRange } from '../utils/mappers';
import type { Appointment, Block, Resource } from '../types';

interface DateRange {
  start: Date;
  end: Date;
}

interface UseTimelineDataParams {
  entityId: string;
  dateRange: DateRange;
  enabled?: boolean;
  employees?: BackendEmployee[];
}

interface UseTimelineDataReturn {
  appointments: Appointment[];
  blocks: Block[];
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTimelineData({
  entityId,
  dateRange,
  enabled = true,
  employees = [],
}: UseTimelineDataParams): UseTimelineDataReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resources: Resource[] = employees.length > 0
    ? [
        ...employees.map((emp) => ({
          id: emp.id,
          name: emp.name,
          avatar: emp.avatar,
          color: emp.color || '#3daaf4',
        })),
        { id: entityId, name: 'Sin asignar', color: '#94a3b8' },
      ]
    : [{ id: entityId, name: 'Mi Local', color: '#3daaf4' }];

  const fetchData = useCallback(async () => {
    if (!enabled || !entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const localId = entityId;
      const { minDate, maxDate } = formatDateRange(dateRange.start, dateRange.end);

      const [aptResult, blockedRaw] = await Promise.all([
        timelineService.getAppointmentsByEntity(entityId, {
          minDate,
          maxDate,
          status: ['PENDING', 'CONFIRMED', 'COMPLETED'],
          limit: 100,
        }),
        timelineService.getBlockedTimes(entityId, minDate, maxDate),
      ]);

      setAppointments(mapBackendAppointments(aptResult.items, localId));
      setBlocks(mapBackendTimeStocks(blockedRaw, localId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
      console.error('Timeline data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, dateRange.start, dateRange.end, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { appointments, blocks, resources, isLoading, error, refetch: fetchData };
}
