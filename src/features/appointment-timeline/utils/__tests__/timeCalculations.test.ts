import { describe, it, expect } from 'vitest';
import {
  generateTimeSlots,
  getTotalHeight,
  calculateSlotPosition,
  calculateAppointmentPosition,
} from '../timeCalculations';
import { SLOT_HEIGHTS } from '../../constants';

function makeDate(hours: number, minutes = 0): Date {
  const d = new Date(2026, 0, 1);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

describe('generateTimeSlots', () => {
  it('should generate correct number of 30min slots from 08:00 to 20:00', () => {
    const date = makeDate(0);
    const slots = generateTimeSlots(date, 8, 20, 30);
    expect(slots).toHaveLength(24);
  });

  it('should generate correct number of 15min slots from 08:00 to 10:00', () => {
    const date = makeDate(0);
    const slots = generateTimeSlots(date, 8, 10, 15);
    expect(slots).toHaveLength(8);
  });

  it('should generate correct number of 60min slots from 08:00 to 12:00', () => {
    const date = makeDate(0);
    const slots = generateTimeSlots(date, 8, 12, 60);
    expect(slots).toHaveLength(4);
  });

  it('should label slots correctly', () => {
    const date = makeDate(0);
    const slots = generateTimeSlots(date, 8, 11, 30);
    expect(slots[0].label).toBe('08:00');
    expect(slots[1].label).toBe('08:30');
    expect(slots[2].label).toBe('09:00');
    expect(slots[3].label).toBe('09:30');
    expect(slots[4].label).toBe('10:00');
    expect(slots[5].label).toBe('10:30');
  });

  it('should return empty array when startHour equals endHour', () => {
    const date = makeDate(0);
    const slots = generateTimeSlots(date, 8, 8, 30);
    expect(slots).toHaveLength(0);
  });

  it('should set time on correct day', () => {
    const date = new Date(2026, 5, 15);
    const slots = generateTimeSlots(date, 8, 9, 30);
    expect(slots[0].time.getFullYear()).toBe(2026);
    expect(slots[0].time.getMonth()).toBe(5);
    expect(slots[0].time.getDate()).toBe(15);
  });
});

describe('getTotalHeight', () => {
  it('should calculate height for 30min slots from 08:00 to 20:00', () => {
    const height = getTotalHeight(8, 20, 30);
    const expectedSlots = 24;
    expect(height).toBe(expectedSlots * SLOT_HEIGHTS[30]);
  });

  it('should calculate height for 15min slots from 08:00 to 10:00', () => {
    const height = getTotalHeight(8, 10, 15);
    const expectedSlots = 8;
    expect(height).toBe(expectedSlots * SLOT_HEIGHTS[15]);
  });

  it('should calculate height for 60min slots from 09:00 to 17:00', () => {
    const height = getTotalHeight(9, 17, 60);
    const expectedSlots = 8;
    expect(height).toBe(expectedSlots * SLOT_HEIGHTS[60]);
  });

  it('should return 0 when startHour equals endHour', () => {
    expect(getTotalHeight(8, 8, 30)).toBe(0);
  });
});

describe('calculateSlotPosition', () => {
  it('should return 0 for time at startHour', () => {
    const time = makeDate(8, 0);
    const pos = calculateSlotPosition(time, { slotDuration: 30, startHour: 8 });
    expect(pos).toBe(0);
  });

  it('should return correct position for 10:00 with 30min slots starting at 08:00', () => {
    const time = makeDate(10, 0);
    const pos = calculateSlotPosition(time, { slotDuration: 30, startHour: 8 });
    const expectedSlots = 4;
    expect(pos).toBe(expectedSlots * SLOT_HEIGHTS[30]);
  });

  it('should return correct position for 09:15 with 15min slots starting at 08:00', () => {
    const time = makeDate(9, 15);
    const pos = calculateSlotPosition(time, { slotDuration: 15, startHour: 8 });
    const expectedSlots = 5;
    expect(pos).toBe(expectedSlots * SLOT_HEIGHTS[15]);
  });

  it('should handle 60min slot duration', () => {
    const time = makeDate(11, 0);
    const pos = calculateSlotPosition(time, { slotDuration: 60, startHour: 8 });
    const expectedSlots = 3;
    expect(pos).toBe(expectedSlots * SLOT_HEIGHTS[60]);
  });
});

describe('calculateAppointmentPosition', () => {
  it('should calculate correct top and height for a 1-hour appointment at 09:00', () => {
    const startAt = makeDate(9, 0);
    const endAt = makeDate(10, 0);
    const config = { slotDuration: 30 as const, startHour: 8 };

    const pos = calculateAppointmentPosition(startAt, endAt, config);

    const expectedTop = 2 * SLOT_HEIGHTS[30]; // 2 slots from 08:00
    const expectedHeight = 2 * SLOT_HEIGHTS[30]; // 2 slots duration
    expect(pos.top).toBe(expectedTop);
    expect(pos.height).toBe(expectedHeight);
  });

  it('should calculate correct position for a 30-min appointment at 14:00', () => {
    const startAt = makeDate(14, 0);
    const endAt = makeDate(14, 30);
    const config = { slotDuration: 30 as const, startHour: 8 };

    const pos = calculateAppointmentPosition(startAt, endAt, config);

    const expectedTop = 12 * SLOT_HEIGHTS[30]; // 12 slots from 08:00
    const expectedHeight = 1 * SLOT_HEIGHTS[30]; // 1 slot duration
    expect(pos.top).toBe(expectedTop);
    expect(pos.height).toBe(expectedHeight);
  });

  it('should handle 15-min slot appointments', () => {
    const startAt = makeDate(8, 15);
    const endAt = makeDate(8, 45);
    const config = { slotDuration: 15 as const, startHour: 8 };

    const pos = calculateAppointmentPosition(startAt, endAt, config);

    const expectedTop = 1 * SLOT_HEIGHTS[15]; // 1 slot from 08:00
    const expectedHeight = 2 * SLOT_HEIGHTS[15]; // 2 slots duration
    expect(pos.top).toBe(expectedTop);
    expect(pos.height).toBe(expectedHeight);
  });

  it('should handle 60-min slot appointments', () => {
    const startAt = makeDate(10, 0);
    const endAt = makeDate(12, 0);
    const config = { slotDuration: 60 as const, startHour: 8 };

    const pos = calculateAppointmentPosition(startAt, endAt, config);

    const expectedTop = 2 * SLOT_HEIGHTS[60]; // 2 slots from 08:00
    const expectedHeight = 2 * SLOT_HEIGHTS[60]; // 2 slots duration
    expect(pos.top).toBe(expectedTop);
    expect(pos.height).toBe(expectedHeight);
  });
});
