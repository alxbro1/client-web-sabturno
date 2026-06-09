import { useState, useEffect, useCallback } from 'react';
import { timelineService, type BackendEmployee } from '@/services/timeline';
import { mapBackendAppointments, mapBackendTimeStocks, formatDateParam, formatDateRange } from '../utils/mappers';
import type { Appointment, Block, Resource } from '../types';

interface UseTimelineDataParams {
  entityId: string;
  date: Date;
  viewMode?: 'day' | 'week';
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
  date,
  viewMode = 'day',
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

      if (viewMode === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { minDate, maxDate } = formatDateRange(weekStart, weekEnd);

        const [aptResult, blockedRaw] = await Promise.all([
          timelineService.getAppointmentsByEntity(entityId, {
            minDate,
            maxDate,
            status: ['PENDING', 'CONFIRMED', 'COMPLETED'],
            limit: 200,
          }),
          timelineService.getBlockedTimes(entityId, minDate, maxDate),
        ]);

        setAppointments(mapBackendAppointments(aptResult.items, localId));
        setBlocks(mapBackendTimeStocks(blockedRaw, localId));
      } else {
        const dateStr = formatDateParam(date);

        const [aptResult, blockedRaw] = await Promise.all([
          timelineService.getAppointmentsByEntity(entityId, {
            minDate: dateStr,
            maxDate: dateStr,
            status: ['PENDING', 'CONFIRMED', 'COMPLETED'],
            limit: 100,
          }),
          timelineService.getBlockedTimes(entityId, dateStr, dateStr),
        ]);

        setAppointments(mapBackendAppointments(aptResult.items, localId));
        setBlocks(mapBackendTimeStocks(blockedRaw, localId));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
      console.error('Timeline data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, date, viewMode, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { appointments, blocks, resources, isLoading, error, refetch: fetchData };
}
