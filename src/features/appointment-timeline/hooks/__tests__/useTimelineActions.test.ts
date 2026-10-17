import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTimelineActions } from '../useTimelineActions';

vi.mock('@/services/timeline', () => ({
  timelineService: {
    blockTimeSlot: vi.fn(),
    unblockTimeSlot: vi.fn(),
    createManualAppointment: vi.fn(),
  },
}));

const { timelineService } = await import('@/services/timeline');
const mockCreate = vi.mocked(timelineService.createManualAppointment);

const LOCAL_ID = 'local-1';
const START = '2026-12-20T17:30:00.000Z';

describe('useTimelineActions.createAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('envía el employeeId cuando se elige un profesional', async () => {
    mockCreate.mockResolvedValue({});
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useTimelineActions({ localId: LOCAL_ID, onSuccess }),
    );

    await result.current.createAppointment({
      serviceId: 7,
      startDateTime: START,
      userName: 'Juan Pérez',
      timezone: 'America/Argentina/Buenos_Aires',
      employeeId: 'emp-1',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      localId: LOCAL_ID,
      serviceId: 7,
      startDateTime: START,
      userName: 'Juan Pérez',
      timezone: 'America/Argentina/Buenos_Aires',
      employeeId: 'emp-1',
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('no envía employeeId cuando no se elige profesional', async () => {
    mockCreate.mockResolvedValue({});
    const { result } = renderHook(() =>
      useTimelineActions({ localId: LOCAL_ID }),
    );

    await result.current.createAppointment({
      serviceId: 7,
      startDateTime: START,
      userName: 'Juan Pérez',
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ localId: LOCAL_ID, serviceId: 7 }),
    );
    expect(mockCreate.mock.calls[0][0].employeeId).toBeUndefined();
  });

  it('pasa el startDateTime ISO tal cual, sin reconvertirlo', async () => {
    mockCreate.mockResolvedValue({});
    const { result } = renderHook(() =>
      useTimelineActions({ localId: LOCAL_ID }),
    );

    await result.current.createAppointment({
      serviceId: 1,
      startDateTime: START,
      userName: 'Ana',
    });

    expect(mockCreate.mock.calls[0][0].startDateTime).toBe(START);
  });

  it('re-lanza el error del backend además de notificarlo', async () => {
    const backendError = new Error('400');
    mockCreate.mockRejectedValue(backendError);
    const onError = vi.fn();
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useTimelineActions({ localId: LOCAL_ID, onSuccess, onError }),
    );

    await expect(
      result.current.createAppointment({
        serviceId: 1,
        startDateTime: START,
        userName: 'Ana',
      }),
    ).rejects.toBe(backendError);

    expect(onError).toHaveBeenCalledWith('400');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
