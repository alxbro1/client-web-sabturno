import { toZonedTime } from "date-fns-tz";
import { DEFAULT_TIMEZONE } from "@/lib/constants/countries";
import type { TimeStockTemplateEntry } from "@/lib/types/local";

export interface DayScheduleRange {
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  dayOfWeek: number;
  ranges: DayScheduleRange[];
}

export interface OpenStatus {
  isOpen: boolean;
  label: string;
}

/**
 * Groups active `TimeStockTemplateEntry` rows by day of week (0 = Sunday …
 * 6 = Saturday), each with its ranges sorted by start time. Returns `null`
 * when there is nothing to show, so the UI can hide the hours line instead
 * of inventing a schedule.
 */
export function getLocalSchedule(
  templates?: TimeStockTemplateEntry[] | null,
): DaySchedule[] | null {
  if (!templates || templates.length === 0) return null;

  const byDay = new Map<number, DayScheduleRange[]>();
  for (const entry of templates) {
    if (entry.isActive === false) continue;
    const ranges = byDay.get(entry.dayOfWeek) ?? [];
    ranges.push({ startTime: entry.startTime, endTime: entry.endTime });
    byDay.set(entry.dayOfWeek, ranges);
  }

  if (byDay.size === 0) return null;

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayOfWeek, ranges]) => ({
      dayOfWeek,
      ranges: [...ranges].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
}

/**
 * Open/closed status "right now" for the local's timezone. Uses
 * `toZonedTime` (project convention, see `docs/time-handling.md`) instead of
 * the runtime's own timezone, so it stays correct regardless of where the
 * client or the server happens to run.
 */
export function getOpenStatus(
  templates: TimeStockTemplateEntry[] | null | undefined,
  now: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE,
): OpenStatus | null {
  const schedule = getLocalSchedule(templates);
  if (!schedule) return null;

  const zoned = toZonedTime(now, timezone);
  const dayOfWeek = zoned.getDay();
  const currentMinutes = zoned.getHours() * 60 + zoned.getMinutes();

  const today = schedule.find((day) => day.dayOfWeek === dayOfWeek);
  const isOpen = Boolean(
    today?.ranges.some((range) => {
      const start = toMinutes(range.startTime);
      const end = toMinutes(range.endTime);
      return currentMinutes >= start && currentMinutes < end;
    }),
  );

  return { isOpen, label: isOpen ? "Abierto ahora" : "Cerrado" };
}

const DAY_ABBR = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
// Display order is Monday-first regardless of the 0=Sunday backend
// convention, so "Mar a Vie" groups Tuesday..Friday the way a business week
// reads, and Sunday only merges with Saturday if it is literally adjacent in
// this order (it isn't, by design: Sunday is last).
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  const hour = String(Number(h)); // drop a leading zero ("09" -> "9")
  return m === "00" ? hour : `${hour}:${m}`;
}

function formatRanges(ranges: DayScheduleRange[]): string {
  return ranges
    .map((r) => `${formatHour(r.startTime)}–${formatHour(r.endTime)}`)
    .join(", ");
}

/**
 * Compact Spanish schedule text, e.g. `"Mar a Vie 10–20 · Sáb 10–18"`.
 * Groups consecutive days (Monday-first order) that share the exact same
 * ranges text into one segment; a day with different hours, or a missing
 * day, starts a new segment instead of merging.
 */
export function formatScheduleSummary(
  schedule: DaySchedule[] | null,
): string | null {
  if (!schedule || schedule.length === 0) return null;

  const byDay = new Map(schedule.map((day) => [day.dayOfWeek, day]));
  const groups: { days: number[]; text: string }[] = [];

  for (const dayOfWeek of WEEK_ORDER) {
    const day = byDay.get(dayOfWeek);
    if (!day || day.ranges.length === 0) continue;

    const text = formatRanges(day.ranges);
    const last = groups[groups.length - 1];
    const lastDay = last?.days[last.days.length - 1];
    const isConsecutive =
      lastDay !== undefined &&
      WEEK_ORDER.indexOf(dayOfWeek) === WEEK_ORDER.indexOf(lastDay) + 1;

    if (last && last.text === text && isConsecutive) {
      last.days.push(dayOfWeek);
    } else {
      groups.push({ days: [dayOfWeek], text });
    }
  }

  if (groups.length === 0) return null;

  return groups
    .map((group) => {
      const label =
        group.days.length > 1
          ? `${DAY_ABBR[group.days[0]]} a ${DAY_ABBR[group.days[group.days.length - 1]]}`
          : DAY_ABBR[group.days[0]];
      return `${label} ${group.text}`;
    })
    .join(" · ");
}
