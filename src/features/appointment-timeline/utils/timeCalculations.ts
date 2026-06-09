import { startOfDay, addMinutes, differenceInMinutes, format } from 'date-fns';
import { SlotDuration } from '../types';
import { SLOT_HEIGHTS, TIMELINE_CONSTANTS } from '../constants';

export interface TimePosition {
  top: number;
  height: number;
}

export function calculateSlotPosition(
  time: Date,
  config: { slotDuration: SlotDuration; startHour: number }
): number {
  const dayStart = startOfDay(time);
  const configStart = new Date(dayStart);
  configStart.setHours(config.startHour, 0, 0, 0);

  const minutesFromStart = differenceInMinutes(time, configStart);
  const slotsFromStart = minutesFromStart / config.slotDuration;

  return slotsFromStart * SLOT_HEIGHTS[config.slotDuration];
}

export function calculateAppointmentPosition(
  startAt: Date,
  endAt: Date,
  config: { slotDuration: SlotDuration; startHour: number }
): TimePosition {
  const dayStart = startOfDay(startAt);
  const configStart = new Date(dayStart);
  configStart.setHours(config.startHour, 0, 0, 0);

  const minutesFromStart = differenceInMinutes(startAt, configStart);
  const durationMinutes = differenceInMinutes(endAt, startAt);

  const slotHeight = SLOT_HEIGHTS[config.slotDuration];
  const top = (minutesFromStart / config.slotDuration) * slotHeight;
  const height = (durationMinutes / config.slotDuration) * slotHeight;

  return { top, height };
}

export function generateTimeSlots(
  date: Date,
  startHour: number,
  endHour: number,
  slotDuration: SlotDuration
): Array<{ time: Date; label: string }> {
  const slots: Array<{ time: Date; label: string }> = [];
  const dayStart = startOfDay(date);
  const start = new Date(dayStart);
  start.setHours(startHour, 0, 0, 0);

  const end = new Date(dayStart);
  end.setHours(endHour, 0, 0, 0);

  let current = start;
  while (current < end) {
    slots.push({
      time: current,
      label: format(current, 'HH:mm'),
    });
    current = addMinutes(current, slotDuration);
  }

  return slots;
}

export function getTotalHeight(
  startHour: number,
  endHour: number,
  slotDuration: SlotDuration
): number {
  const totalSlots = ((endHour - startHour) * 60) / slotDuration;
  return totalSlots * SLOT_HEIGHTS[slotDuration];
}