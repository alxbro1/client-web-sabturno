import { describe, expect, it } from "vitest";
import { filterFutureTimeSlots } from "./timeSlots";

const slots = [
  { time: "09:00", available: true },
  { time: "10:30", available: true },
  { time: "11:00", available: false },
  { time: "16:00", available: true },
];
const TZ = "America/Argentina/Buenos_Aires"; // UTC-3

describe("filterFutureTimeSlots", () => {
  it("hides slots whose start is before now in the local's timezone", () => {
    // 2026-09-29T13:45Z = 10:45 in Buenos Aires
    const now = new Date("2026-09-29T13:45:00.000Z");
    expect(
      filterFutureTimeSlots(slots, "2026-09-29", TZ, now).map((s) => s.time),
    ).toEqual(["11:00", "16:00"]);
  });

  it("hides a slot starting exactly now", () => {
    const now = new Date("2026-09-29T13:30:00.000Z"); // 10:30 BA
    expect(
      filterFutureTimeSlots(slots, "2026-09-29", TZ, now).map((s) => s.time),
    ).toEqual(["11:00", "16:00"]);
  });

  it("uses the given timezone, not the machine's", () => {
    // 10:45 BA is already 15:45 in Madrid-ish offsets; in UTC-3 it is still morning
    const now = new Date("2026-09-29T13:45:00.000Z");
    expect(
      filterFutureTimeSlots(slots, "2026-09-29", "Asia/Tokyo", now),
    ).toEqual([]);
  });

  it("keeps every slot on a future day", () => {
    const now = new Date("2026-09-29T23:00:00.000Z");
    expect(filterFutureTimeSlots(slots, "2026-09-30", TZ, now)).toEqual(slots);
  });

  it("drops every slot on a past day and handles empty input", () => {
    const now = new Date("2026-09-29T13:45:00.000Z");
    expect(filterFutureTimeSlots(slots, "2026-09-28", TZ, now)).toEqual([]);
    expect(filterFutureTimeSlots([], "2026-09-29", TZ, now)).toEqual([]);
  });
});
