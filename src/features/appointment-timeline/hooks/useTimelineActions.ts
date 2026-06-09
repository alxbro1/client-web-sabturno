import { useCallback } from 'react';
import { timelineService, type BlockTimePayload } from '@/services/timeline';
import { formatDateParam } from '../utils/mappers';

interface UseTimelineActionsParams {
  localId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useTimelineActions({ localId, onSuccess, onError }: UseTimelineActionsParams) {
  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      const message = err instanceof Error ? err.message : fallback;
      console.error('Timeline action error:', err);
      onError?.(message);
    },
    [onError],
  );

  const blockSlot = useCallback(
    async (date: Date, startTime: string, endTime: string, notes?: string) => {
      try {
        const payload: BlockTimePayload = {
          localId,
          date: formatDateParam(date),
          startTime,
          endTime,
          notes,
        };
        await timelineService.blockTimeSlot(payload);
        onSuccess?.();
      } catch (err) {
        handleError(err, 'Error al bloquear el horario');
      }
    },
    [localId, onSuccess, handleError],
  );

  const unblockSlot = useCallback(
    async (id: string) => {
      try {
        await timelineService.unblockTimeSlot(id);
        onSuccess?.();
      } catch (err) {
        handleError(err, 'Error al desbloquear el horario');
      }
    },
    [onSuccess, handleError],
  );

  const createAppointment = useCallback(
    async (params: {
      serviceId: number;
      startDateTime: Date;
      userName: string;
      timezone?: string;
    }) => {
      try {
        await timelineService.createManualAppointment({
          localId,
          serviceId: params.serviceId,
          startDateTime: params.startDateTime.toISOString(),
          userName: params.userName,
          timezone: params.timezone,
        });
        onSuccess?.();
      } catch (err) {
        handleError(err, 'Error al crear el turno');
      }
    },
    [localId, onSuccess, handleError],
  );

  return { blockSlot, unblockSlot, createAppointment };
}
