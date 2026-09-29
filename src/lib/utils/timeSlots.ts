import { fromZonedTime } from "date-fns-tz";
import type { TimeSlot } from "@/lib/types/booking";

/**
 * Drops slots whose start instant is <= now. Slots are "HH:mm" wall-clock times
 * of `dateStr` ("YYYY-MM-DD") in `timezone`; comparison is between absolute instants.
 */
export function filterFutureTimeSlots(
  slots: TimeSlot[],
  dateStr: string,
  timezone: string,
  now: Date = new Date(),
): TimeSlot[] {
  const nowMs = now.getTime();
  return slots.filter(
    (slot) =>
      fromZonedTime(`${dateStr}T${slot.time}:00`, timezone).getTime() > nowMs,
  );
}
