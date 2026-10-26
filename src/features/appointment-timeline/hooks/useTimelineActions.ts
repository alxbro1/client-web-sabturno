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

  /**
   * Crea un turno manual (walk-in o pedido por teléfono).
   *
   * `startDateTime` llega ya como ISO UTC: la conversión desde la hora de pared
   * necesita la timezone del local, que la vive el formulario (ver
   * `NewAppointmentDialog`). Convertirla acá con la zona del runtime corría el
   * turno cuando el navegador no está en la zona del local.
   *
   * El error se re-lanza además de notificarse por `onError`, porque el
   * formulario necesita distinguir éxito de fallo para no cerrarse como si
   * hubiera guardado.
   */
  const createAppointment = useCallback(
    async (params: {
      serviceId: number;
      startDateTime: string;
      userName: string;
      timezone?: string;
      employeeId?: string;
      phoneNumber?: string;
    }) => {
      try {
        await timelineService.createManualAppointment({
          localId,
          serviceId: params.serviceId,
          startDateTime: params.startDateTime,
          userName: params.userName,
          timezone: params.timezone,
          employeeId: params.employeeId,
          // Never send an empty string: the backend field is optional.
          phoneNumber: params.phoneNumber?.trim() || undefined,
        });
        onSuccess?.();
      } catch (err) {
        handleError(err, 'Error al crear el turno');
        throw err;
      }
    },
    [localId, onSuccess, handleError],
  );

  return { blockSlot, unblockSlot, createAppointment };
}
