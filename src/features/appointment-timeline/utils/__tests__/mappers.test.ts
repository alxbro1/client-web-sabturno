import { describe, it, expect } from 'vitest';
import type { BackendAppointment, BackendTimeStock } from '@/services/timeline';
import {
  mapBackendAppointment,
  mapBackendTimeStock,
  mapBackendAppointments,
  mapBackendTimeStocks,
  formatDateParam,
  formatDateRange,
} from '../mappers';

const LOCAL_ID = 'local-abc-123';

function makeBackendAppointment(overrides: Partial<BackendAppointment> = {}): BackendAppointment {
  return {
    id: 42,
    startDateTime: '2026-06-20T10:00:00.000Z',
    endDateTime: '2026-06-20T11:00:00.000Z',
    state: 'CONFIRMED',
    userName: 'Juan Pérez',
    email: 'juan@test.com',
    serviceId: 1,
    localId: LOCAL_ID,
    employeeId: 'emp-1',
    createdAt: '2026-06-19T00:00:00.000Z',
    updatedAt: '2026-06-19T00:00:00.000Z',
    service: {
      id: 1,
      name: 'Corte de pelo',
      cost: 2500,
      duration: 30,
    },
    ...overrides,
  };
}

function makeBackendTimeStock(overrides: Partial<BackendTimeStock> = {}): BackendTimeStock {
  return {
    id: 'ts-uuid-001',
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

// ─── mapBackendAppointment ────────────────────────────────────────────

describe('mapBackendAppointment', () => {
  it('maps id to string', () => {
    const result = mapBackendAppointment(makeBackendAppointment({ id: 99 }), LOCAL_ID);
    expect(result.id).toBe('99');
  });

  it('maps startDateTime/endAt to Date objects', () => {
    const result = mapBackendAppointment(makeBackendAppointment(), LOCAL_ID);
    expect(result.startAt).toBeInstanceOf(Date);
    expect(result.endAt).toBeInstanceOf(Date);
    expect(result.startAt.toISOString()).toBe('2026-06-20T10:00:00.000Z');
    expect(result.endAt.toISOString()).toBe('2026-06-20T11:00:00.000Z');
  });

  it('uses employeeId as resourceId', () => {
    const result = mapBackendAppointment(
      makeBackendAppointment({ employeeId: 'emp-42' }),
      LOCAL_ID,
    );
    expect(result.resourceId).toBe('emp-42');
  });

  it('falls back to localId when employeeId is null', () => {
    const result = mapBackendAppointment(
      makeBackendAppointment({ employeeId: undefined }),
      LOCAL_ID,
    );
    expect(result.resourceId).toBe(LOCAL_ID);
  });

  it('uses service.name as title', () => {
    const result = mapBackendAppointment(
      makeBackendAppointment({ service: { id: 1, name: 'Corte de barba', cost: 1500, duration: 20 } }),
      LOCAL_ID,
    );
    expect(result.title).toBe('Corte de barba');
  });

  it('falls back to userName when service is absent', () => {
    const result = mapBackendAppointment(
      makeBackendAppointment({ service: undefined, userName: 'María López' }),
      LOCAL_ID,
    );
    expect(result.title).toBe('María López');
  });

  it('falls back to "Sin título" when both service and userName are absent', () => {
    const result = mapBackendAppointment(
      makeBackendAppointment({ service: undefined, userName: undefined }),
      LOCAL_ID,
    );
    expect(result.title).toBe('Sin título');
  });

  it.each(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const)(
    'maps state %s correctly',
    (state) => {
      const result = mapBackendAppointment(makeBackendAppointment({ state }), LOCAL_ID);
      expect(result.status).toBe(state);
    },
  );

  it('defaults unknown state to PENDING', () => {
    const result = mapBackendAppointment(
      makeBackendAppointment({ state: 'UNKNOWN' as any }),
      LOCAL_ID,
    );
    expect(result.status).toBe('PENDING');
  });

  it('maps customerName and customerEmail', () => {
    const result = mapBackendAppointment(
      makeBackendAppointment({ userName: 'Ana', email: 'ana@test.com' }),
      LOCAL_ID,
    );
    expect(result.customerName).toBe('Ana');
    expect(result.customerEmail).toBe('ana@test.com');
  });

  it('maps serviceName from service.name', () => {
    const result = mapBackendAppointment(makeBackendAppointment(), LOCAL_ID);
    expect(result.serviceName).toBe('Corte de pelo');
  });
});

// ─── mapBackendTimeStock ──────────────────────────────────────────────

describe('mapBackendTimeStock', () => {
  it('returns Block when status is BLOCKED', () => {
    const result = mapBackendTimeStock(makeBackendTimeStock(), LOCAL_ID);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('ts-uuid-001');
    expect(result!.startAt).toBeInstanceOf(Date);
    expect(result!.endAt).toBeInstanceOf(Date);
    expect(result!.notes).toBe('Almuerzo');
  });

  it('returns null when status is AVAILABLE', () => {
    const result = mapBackendTimeStock(
      makeBackendTimeStock({ status: 'AVAILABLE' }),
      LOCAL_ID,
    );
    expect(result).toBeNull();
  });

  it('returns null when status is RESERVED', () => {
    const result = mapBackendTimeStock(
      makeBackendTimeStock({ status: 'RESERVED' }),
      LOCAL_ID,
    );
    expect(result).toBeNull();
  });

  it('uses employeeId as resourceId', () => {
    const result = mapBackendTimeStock(
      makeBackendTimeStock({ employeeId: 'emp-99' }),
      LOCAL_ID,
    );
    expect(result!.resourceId).toBe('emp-99');
  });

  it('falls back to localId when employeeId is undefined', () => {
    const result = mapBackendTimeStock(
      makeBackendTimeStock({ employeeId: undefined }),
      LOCAL_ID,
    );
    expect(result!.resourceId).toBe(LOCAL_ID);
  });

  it('sets notes to undefined when notes is null', () => {
    const result = mapBackendTimeStock(
      makeBackendTimeStock({ notes: undefined }),
      LOCAL_ID,
    );
    expect(result!.notes).toBeUndefined();
  });

  it('CRITICAL: returns null when status field is missing (old backend bug)', () => {
    const rawWithoutStatus = {
      id: 'ts-uuid-002',
      localId: LOCAL_ID,
      moduleStartTime: '2026-06-20T14:00:00.000Z',
      moduleEndTime: '2026-06-20T15:00:00.000Z',
      notes: 'Test',
      isTemplate: false,
      createdAt: '2026-06-19T00:00:00.000Z',
      updatedAt: '2026-06-19T00:00:00.000Z',
    } as unknown as BackendTimeStock;

    const result = mapBackendTimeStock(rawWithoutStatus, LOCAL_ID);
    expect(result).toBeNull();
  });
});

// ─── mapBackendAppointments / mapBackendTimeStocks ────────────────────

describe('mapBackendAppointments', () => {
  it('maps multiple appointments', () => {
    const raws = [
      makeBackendAppointment({ id: 1 }),
      makeBackendAppointment({ id: 2, state: 'PENDING' }),
    ];
    const result = mapBackendAppointments(raws, LOCAL_ID);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
    expect(result[1].status).toBe('PENDING');
  });

  it('returns empty array for empty input', () => {
    expect(mapBackendAppointments([], LOCAL_ID)).toEqual([]);
  });
});

describe('mapBackendTimeStocks', () => {
  it('filters out non-BLOCKED entries', () => {
    const raws = [
      makeBackendTimeStock({ id: 'ts-1', status: 'BLOCKED' }),
      makeBackendTimeStock({ id: 'ts-2', status: 'AVAILABLE' }),
      makeBackendTimeStock({ id: 'ts-3', status: 'RESERVED' }),
      makeBackendTimeStock({ id: 'ts-4', status: 'BLOCKED' }),
    ];
    const result = mapBackendTimeStocks(raws, LOCAL_ID);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('ts-1');
    expect(result[1].id).toBe('ts-4');
  });

  it('returns empty array when all entries are non-BLOCKED', () => {
    const raws = [
      makeBackendTimeStock({ status: 'AVAILABLE' }),
      makeBackendTimeStock({ status: 'RESERVED' }),
    ];
    expect(mapBackendTimeStocks(raws, LOCAL_ID)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(mapBackendTimeStocks([], LOCAL_ID)).toEqual([]);
  });
});

// ─── formatDateParam / formatDateRange ───────────────────────────────

describe('formatDateParam', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDateParam(new Date(2026, 5, 3))).toBe('2026-06-03');
  });

  it('pads single-digit month and day', () => {
    expect(formatDateParam(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('handles December correctly', () => {
    expect(formatDateParam(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('formatDateRange', () => {
  it('returns minDate and maxDate strings', () => {
    const start = new Date(2026, 5, 1);
    const end = new Date(2026, 5, 30);
    const result = formatDateRange(start, end);
    expect(result).toEqual({ minDate: '2026-06-01', maxDate: '2026-06-30' });
  });
});
