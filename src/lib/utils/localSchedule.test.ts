import { describe, expect, it } from "vitest";
import {
  getLocalSchedule,
  getOpenStatus,
  formatScheduleSummary,
} from "./localSchedule";
import type { TimeStockTemplateEntry } from "@/lib/types/local";

const TZ = "America/Argentina/Buenos_Aires"; // UTC-3, no DST

function template(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  isActive = true,
): TimeStockTemplateEntry {
  return { dayOfWeek, startTime, endTime, isActive };
}

describe("getLocalSchedule", () => {
  it("returns null when there are no templates", () => {
    expect(getLocalSchedule(undefined)).toBeNull();
    expect(getLocalSchedule([])).toBeNull();
  });

  it("groups ranges by day of week, sorted", () => {
    const schedule = getLocalSchedule([
      template(2, "10:00", "20:00"),
      template(0, "10:00", "18:00"),
    ]);

    expect(schedule).toEqual([
      { dayOfWeek: 0, ranges: [{ startTime: "10:00", endTime: "18:00" }] },
      { dayOfWeek: 2, ranges: [{ startTime: "10:00", endTime: "20:00" }] },
    ]);
  });

  it("supports multiple ranges the same day (split shift) sorted by start", () => {
    const schedule = getLocalSchedule([
      template(1, "16:00", "20:00"),
      template(1, "10:00", "13:00"),
    ]);

    expect(schedule).toEqual([
      {
        dayOfWeek: 1,
        ranges: [
          { startTime: "10:00", endTime: "13:00" },
          { startTime: "16:00", endTime: "20:00" },
        ],
      },
    ]);
  });

  it("ignores inactive templates", () => {
    expect(getLocalSchedule([template(1, "10:00", "18:00", false)])).toBeNull();
  });
});

describe("getOpenStatus", () => {
  const templates = [template(1, "10:00", "20:00")]; // Monday

  it("returns null when there is no schedule", () => {
    expect(getOpenStatus(undefined, new Date(), TZ)).toBeNull();
  });

  it("is open when local time falls inside a range", () => {
    // 2026-09-28 is a Monday. 15:00 ART = 18:00 UTC.
    const now = new Date("2026-09-28T18:00:00.000Z");
    expect(getOpenStatus(templates, now, TZ)).toEqual({
      isOpen: true,
      label: "Abierto ahora",
    });
  });

  it("is closed outside the range on the same day", () => {
    // 21:00 ART = 00:00 UTC the next day
    const now = new Date("2026-09-29T00:00:00.000Z");
    expect(getOpenStatus(templates, now, TZ)).toEqual({
      isOpen: false,
      label: "Cerrado",
    });
  });

  it("is closed on a day with no templates", () => {
    // Tuesday 15:00 ART
    const now = new Date("2026-09-29T18:00:00.000Z");
    expect(getOpenStatus(templates, now, TZ)).toEqual({
      isOpen: false,
      label: "Cerrado",
    });
  });

  it("uses the given timezone, not the runtime one, near a UTC boundary", () => {
    // 22:00 UTC on Sunday 2026-09-27 is 19:00 in Argentina (UTC-3), still
    // outside the 20:00–23:59 window. A naive implementation reading the
    // hour off the raw (runtime-timezone) Date would see "22:00" and
    // wrongly report open — this is the regression guard for that bug.
    const farTemplates = [template(0, "20:00", "23:59")]; // Sunday
    const now = new Date("2026-09-27T22:00:00.000Z");
    expect(getOpenStatus(farTemplates, now, TZ)?.isOpen).toBe(false);
  });
});

describe("formatScheduleSummary", () => {
  it("returns null with no schedule", () => {
    expect(formatScheduleSummary(null)).toBeNull();
  });

  it("groups consecutive days with equal hours and drops :00", () => {
    const schedule = getLocalSchedule([
      template(2, "10:00", "20:00"), // Tue
      template(3, "10:00", "20:00"), // Wed
      template(4, "10:00", "20:00"), // Thu
      template(5, "10:00", "20:00"), // Fri
      template(6, "10:00", "18:00"), // Sat
    ]);

    expect(formatScheduleSummary(schedule)).toBe("Mar a Vie 10–20 · Sáb 10–18");
  });

  it("keeps a half-hour minute that is not :00", () => {
    const schedule = getLocalSchedule([template(1, "09:30", "13:00")]);
    expect(formatScheduleSummary(schedule)).toBe("Lun 9:30–13");
  });

  it("renders a single day alone without a range dash between days", () => {
    const schedule = getLocalSchedule([template(0, "10:00", "14:00")]);
    expect(formatScheduleSummary(schedule)).toBe("Dom 10–14");
  });

  it("does not merge across a day gap even with equal hours", () => {
    const schedule = getLocalSchedule([
      template(1, "10:00", "18:00"), // Mon
      template(3, "10:00", "18:00"), // Wed (Tue missing)
    ]);
    expect(formatScheduleSummary(schedule)).toBe("Lun 10–18 · Mié 10–18");
  });
});
