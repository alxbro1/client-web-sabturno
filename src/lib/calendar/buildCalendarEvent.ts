import { DEFAULT_TIMEZONE } from "@/lib/constants/countries";
import { formatLocalDate } from "@/lib/utils/date";

/**
 * Minimal shape these pure helpers need from an appointment. Structurally
 * compatible with the `GET /appointments/:id/public` response (full
 * `service`/`local` rows), so callers can pass that response directly.
 *
 * `startDateTime` is the backend's UTC `DateTime` (ISO string, e.g. with a
 * trailing `Z`). Google Calendar and the ICS `DTSTART`/`DTEND` fields accept
 * a UTC instant natively (`...T...Z`) and render it in the viewer's own
 * timezone — this is formatting a precise instant, not deriving a "local
 * calendar day" from it, so the `toISOString().split('T')[0]` anti-pattern
 * documented in `docs/time-handling.md` does not apply here.
 */
export interface CalendarAppointmentInput {
  id: number | string;
  startDateTime: string;
  /** IANA timezone of the business; defaults to `DEFAULT_TIMEZONE`. Only used for human-readable display text (`buildShareText`), never for the UTC instant encoding. */
  timezone?: string;
  service: {
    name: string;
    /** Minutes. */
    duration: number;
  };
  local: {
    name: string;
    address: string;
  };
}

function getEndDate(appointment: CalendarAppointmentInput): Date {
  const start = new Date(appointment.startDateTime);
  return new Date(start.getTime() + appointment.service.duration * 60_000);
}

/** Formats a `Date` as Google/ICS's compact UTC instant: `YYYYMMDDTHHMMSSZ`. */
function formatUtcCompact(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildEventTitle(appointment: CalendarAppointmentInput): string {
  return `${appointment.service.name} - ${appointment.local.name}`;
}

/**
 * Builds a Google Calendar "quick add" URL
 * (https://calendar.google.com/calendar/render?action=TEMPLATE) prefilled
 * with the appointment's service/business as title, UTC start/end range,
 * business address as location, and a Spanish summary as details.
 */
export function buildGoogleCalendarUrl(appointment: CalendarAppointmentInput): string {
  const start = new Date(appointment.startDateTime);
  const end = getEndDate(appointment);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: buildEventTitle(appointment),
    dates: `${formatUtcCompact(start)}/${formatUtcCompact(end)}`,
    details: buildShareText(appointment),
    location: appointment.local.address,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Escapes text per RFC5545 §3.3.11 (TEXT value type) for use inside an .ics property value. */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Builds a minimal valid RFC5545 .ics file content (VCALENDAR/VEVENT) for
 * the appointment. Hand-built (no new dependency), using `\r\n` line
 * endings as the RFC requires.
 */
export function buildIcsContent(appointment: CalendarAppointmentInput): string {
  const start = new Date(appointment.startDateTime);
  const end = getEndDate(appointment);
  const now = new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SabTurno//Appointment Confirmation//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:appointment-${appointment.id}@sabturno.com`,
    `DTSTAMP:${formatUtcCompact(now)}`,
    `DTSTART:${formatUtcCompact(start)}`,
    `DTEND:${formatUtcCompact(end)}`,
    `SUMMARY:${escapeIcsText(buildEventTitle(appointment))}`,
    `LOCATION:${escapeIcsText(appointment.local.address)}`,
    `DESCRIPTION:${escapeIcsText(buildShareText(appointment))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

/**
 * Plain-language Spanish summary of the appointment, suitable for
 * `navigator.share()` or clipboard. Unlike the UTC instant encoding above,
 * this is a human-readable display string, so it correctly goes through
 * `formatLocalDate` (timezone-aware) instead of a raw UTC read.
 */
export function buildShareText(appointment: CalendarAppointmentInput): string {
  const timezone = appointment.timezone || DEFAULT_TIMEZONE;
  const formattedDateTime = formatLocalDate(
    appointment.startDateTime,
    timezone,
    "EEEE d 'de' MMMM 'a las' HH:mm 'hs'",
  );

  return `Turno en ${appointment.local.name}: ${appointment.service.name}, ${formattedDateTime}. Dirección: ${appointment.local.address}.`;
}
