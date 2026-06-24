import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTimelineData } from '../useTimelineData';
import type { BackendEmployee, BackendTimeStock, BackendAppointment, PaginatedResponse } from '@/services/timeline';

vi.mock('@/services/timeline', () => ({
  timelineService: {
    getAppointmentsByEntity: vi.fn(),
    getBlockedTimes: vi.fn(),
  },
}));

const { timelineService } = await import('@/services/timeline');
const mockGetAppointments = vi.mocked(timelineService.getAppointmentsByEntity);
const mockGetBlockedTimes = vi.mocked(timelineService.getBlockedTimes);

const LOCAL_ID = 'local-1';

function makeBackendAppointment(overrides: Partial<BackendAppointment> = {}): BackendAppointment {
  return {
    id: 1,
    startDateTime: '2026-06-20T10:00:00.000Z',
    endDateTime: '2026-06-20T11:00:00.000Z',
    state: 'CONFIRMED',
    userName: 'Juan',
    serviceId: 1,
    localId: LOCAL_ID,
    employeeId: 'emp-1',
    createdAt: '2026-06-19T00:00:00.000Z',
    updatedAt: '2026-06-19T00:00:00.000Z',
    service: { id: 1, name: 'Corte', cost: 2500, duration: 30 },
    ...overrides,
  };
}

function makeBackendTimeStock(overrides: Partial<BackendTimeStock> = {}): BackendTimeStock {
  return {
    id: 'ts-1',
    localId: LOCAL_ID,
    moduleStartTime: '2026-06-20T12:00:00.000Z',
    moduleEndTime: '2026-06-20T13:00:00.000Z',
    status: 'BLOCKED',
    employeeId: 'emp-1',
    notes: 'Almuerzo',
    isTemplate: false,
    createdAt: '2026-06-19T00:00:00.000Z',
    updatedAt: '2026-06-19T00:00:00.000Z',
    ...overrides,
  };
}

function makeEmployee(overrides: Partial<BackendEmployee> = {}): BackendEmployee {
  return {
    id: 'emp-1',
    name: 'Lucía',
    color: '#ff0000',
    isActive: true,
    localId: LOCAL_ID,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function emptyPaginatedResponse(): PaginatedResponse<BackendAppointment> {
  return { items: [], nextCursor: null, hasMore: false };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAppointments.mockResolvedValue(emptyPaginatedResponse());
  mockGetBlockedTimes.mockResolvedValue([]);
});

describe('useTimelineData', () => {
  it('fetches appointments and blocks on mount', async () => {
    mockGetAppointments.mockResolvedValue({
      items: [makeBackendAppointment()],
      nextCursor: null,
      hasMore: false,
    });
    mockGetBlockedTimes.mockResolvedValue([makeBackendTimeStock()]);

    const dateRange = { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) };
    const { result } = renderHook(() =>
      useTimelineData({ entityId: LOCAL_ID, dateRange, enabled: true }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetAppointments).toHaveBeenCalledWith(LOCAL_ID, {
      minDate: '2026-06-20',
      maxDate: '2026-06-20',
      status: ['PENDING', 'CONFIRMED', 'COMPLETED'],
      limit: 100,
    });
    expect(mockGetBlockedTimes).toHaveBeenCalledWith(LOCAL_ID, '2026-06-20', '2026-06-20');
  });

  it('maps appointments to domain types', async () => {
    mockGetAppointments.mockResolvedValue({
      items: [makeBackendAppointment({ id: 99, employeeId: 'emp-5' })],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() =>
      useTimelineData({ entityId: LOCAL_ID, dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) }, enabled: true }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0].id).toBe('99');
    expect(result.current.appointments[0].resourceId).toBe('emp-5');
    expect(result.current.appointments[0].title).toBe('Corte');
  });

  it('maps BLOCKED time stocks to blocks', async () => {
    mockGetBlockedTimes.mockResolvedValue([
      makeBackendTimeStock({ id: 'ts-a', status: 'BLOCKED' }),
      makeBackendTimeStock({ id: 'ts-b', status: 'BLOCKED' }),
    ]);

    const { result } = renderHook(() =>
      useTimelineData({ entityId: LOCAL_ID, dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) }, enabled: true }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.blocks).toHaveLength(2);
    expect(result.current.blocks[0].id).toBe('ts-a');
    expect(result.current.blocks[0].startAt).toBeInstanceOf(Date);
  });

  it('discards non-BLOCKED time stocks', async () => {
    mockGetBlockedTimes.mockResolvedValue([
      makeBackendTimeStock({ id: 'ts-blocked', status: 'BLOCKED' }),
      makeBackendTimeStock({ id: 'ts-available', status: 'AVAILABLE' }),
      makeBackendTimeStock({ id: 'ts-reserved', status: 'RESERVED' }),
    ]);

    const { result } = renderHook(() =>
      useTimelineData({ entityId: LOCAL_ID, dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) }, enabled: true }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.blocks[0].id).toBe('ts-blocked');
  });

  it('handles empty responses without error', async () => {
    mockGetAppointments.mockResolvedValue(emptyPaginatedResponse());
    mockGetBlockedTimes.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useTimelineData({ entityId: LOCAL_ID, dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) }, enabled: true }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.appointments).toEqual([]);
    expect(result.current.blocks).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('sets error on API failure', async () => {
    mockGetAppointments.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useTimelineData({ entityId: LOCAL_ID, dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) }, enabled: true }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.appointments).toEqual([]);
  });

  it('does not fetch when enabled is false', () => {
    renderHook(() =>
      useTimelineData({ entityId: LOCAL_ID, dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) }, enabled: false }),
    );

    expect(mockGetAppointments).not.toHaveBeenCalled();
    expect(mockGetBlockedTimes).not.toHaveBeenCalled();
  });

  it('does not fetch when entityId is empty', () => {
    renderHook(() =>
      useTimelineData({ entityId: '', dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) }, enabled: true }),
    );

    expect(mockGetAppointments).not.toHaveBeenCalled();
  });

  it('re-fetches when dateRange changes', async () => {
    const range1 = { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) };
    const range2 = { start: new Date(2026, 5, 22), end: new Date(2026, 5, 28) };

    const { rerender } = renderHook(
      ({ dateRange }) => useTimelineData({ entityId: LOCAL_ID, dateRange, enabled: true }),
      { initialProps: { dateRange: range1 } },
    );

    await waitFor(() => expect(mockGetAppointments).toHaveBeenCalledTimes(1));

    rerender({ dateRange: range2 });

    await waitFor(() => expect(mockGetAppointments).toHaveBeenCalledTimes(2));
    expect(mockGetAppointments).toHaveBeenLastCalledWith(LOCAL_ID, {
      minDate: '2026-06-22',
      maxDate: '2026-06-28',
      status: ['PENDING', 'CONFIRMED', 'COMPLETED'],
      limit: 100,
    });
  });

  it('passes week range to API when in week view', async () => {
    const weekStart = new Date(2026, 5, 22);
    const weekEnd = new Date(2026, 5, 28);

    mockGetAppointments.mockResolvedValue({
      items: [
        makeBackendAppointment({ id: 1, startDateTime: '2026-06-22T10:00:00.000Z' }),
        makeBackendAppointment({ id: 2, startDateTime: '2026-06-25T14:00:00.000Z' }),
      ],
      nextCursor: null,
      hasMore: false,
    });
    mockGetBlockedTimes.mockResolvedValue([
      makeBackendTimeStock({ id: 'ts-week', moduleStartTime: '2026-06-23T09:00:00.000Z', moduleEndTime: '2026-06-23T10:00:00.000Z' }),
    ]);

    const { result } = renderHook(() =>
      useTimelineData({
        entityId: LOCAL_ID,
        dateRange: { start: weekStart, end: weekEnd },
        enabled: true,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetAppointments).toHaveBeenCalledWith(LOCAL_ID, {
      minDate: '2026-06-22',
      maxDate: '2026-06-28',
      status: ['PENDING', 'CONFIRMED', 'COMPLETED'],
      limit: 100,
    });
    expect(mockGetBlockedTimes).toHaveBeenCalledWith(LOCAL_ID, '2026-06-22', '2026-06-28');
    expect(result.current.appointments).toHaveLength(2);
    expect(result.current.blocks).toHaveLength(1);
  });

  describe('resources', () => {
    it('returns "Mi Local" resource when no employees provided', async () => {
      const { result } = renderHook(() =>
        useTimelineData({ entityId: LOCAL_ID, dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) }, enabled: true }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.resources).toHaveLength(1);
      expect(result.current.resources[0]).toEqual({
        id: LOCAL_ID,
        name: 'Mi Local',
        color: '#3daaf4',
      });
    });

    it('maps employees to resources with "Sin asignar" fallback', async () => {
      const employees = [
        makeEmployee({ id: 'emp-1', name: 'Lucía', color: '#ff0000' }),
        makeEmployee({ id: 'emp-2', name: 'Carlos', color: '#00ff00' }),
      ];

      const { result } = renderHook(() =>
        useTimelineData({
          entityId: LOCAL_ID,
          dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) },
          enabled: true,
          employees,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.resources).toHaveLength(3);
      expect(result.current.resources[0].name).toBe('Lucía');
      expect(result.current.resources[0].color).toBe('#ff0000');
      expect(result.current.resources[1].name).toBe('Carlos');
      expect(result.current.resources[2]).toEqual({
        id: LOCAL_ID,
        name: 'Sin asignar',
        color: '#94a3b8',
      });
    });

    it('defaults employee color to #3daaf4 when color is missing', async () => {
      const employees = [makeEmployee({ id: 'emp-1', name: 'Lucía', color: undefined })];

      const { result } = renderHook(() =>
        useTimelineData({
          entityId: LOCAL_ID,
          dateRange: { start: new Date(2026, 5, 20), end: new Date(2026, 5, 20) },
          enabled: true,
          employees,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.resources[0].color).toBe('#3daaf4');
    });
  });
});
