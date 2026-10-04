import { describe, expect, it } from "vitest";
import {
  buildGoogleCalendarUrl,
  buildIcsContent,
  buildShareText,
  type CalendarAppointmentInput,
} from "./buildCalendarEvent";

function makeAppointment(
  overrides: Partial<CalendarAppointmentInput> = {},
): CalendarAppointmentInput {
  return {
    id: 42,
    startDateTime: "2026-10-15T15:00:00.000Z",
    timezone: "America/Argentina/Buenos_Aires",
    service: { name: "Corte de pelo", duration: 30 },
    local: { name: "Peluquería Centro", address: "Av. Siempre Viva 123" },
    ...overrides,
  };
}

describe("buildGoogleCalendarUrl", () => {
  it("builds an on-the-hour UTC start/end range offset by the service duration", () => {
    const url = buildGoogleCalendarUrl(makeAppointment());
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe(
      "https://calendar.google.com/calendar/render",
    );
    expect(parsed.searchParams.get("action")).toBe("TEMPLATE");
    expect(parsed.searchParams.get("dates")).toBe(
      "20261015T150000Z/20261015T153000Z",
    );
  });

  it("rolls the end date over to the next UTC day when the appointment crosses midnight", () => {
    const url = buildGoogleCalendarUrl(
      makeAppointment({
        startDateTime: "2026-10-15T23:30:00.000Z",
        service: { name: "Corte de pelo", duration: 60 },
      }),
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get("dates")).toBe(
      "20261015T233000Z/20261016T003000Z",
    );
  });

  it("encodes the title, location and details, preserving accented characters", () => {
    const url = buildGoogleCalendarUrl(
      makeAppointment({
        service: { name: "Peinado & Color", duration: 30 },
        local: {
          name: "Peluquería Ñandú, Belleza",
          address: "Av. San Martín 456",
        },
      }),
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get("text")).toBe(
      "Peinado & Color - Peluquería Ñandú, Belleza",
    );
    expect(parsed.searchParams.get("location")).toBe("Av. San Martín 456");
    expect(parsed.searchParams.get("details")).toContain("Peluquería Ñandú");
  });
});

describe("buildIcsContent", () => {
  it("returns a minimal valid RFC5545 VCALENDAR/VEVENT with CRLF line endings", () => {
    const ics = buildIcsContent(makeAppointment());
    const lines = ics.split("\r\n");

    expect(ics.includes("\n") && !ics.includes("\r\n")).toBe(false);
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("UID:appointment-42@sabturno.com");
    expect(lines).toContain("DTSTART:20261015T150000Z");
    expect(lines).toContain("DTEND:20261015T153000Z");
    expect(lines).toContain("END:VEVENT");
    expect(lines[lines.length - 1]).toBe("END:VCALENDAR");
    expect(lines.some((line) => /^DTSTAMP:\d{8}T\d{6}Z$/.test(line))).toBe(
      true,
    );
  });

  it("rolls DTEND over to the next UTC day when the appointment crosses midnight", () => {
    const ics = buildIcsContent(
      makeAppointment({
        startDateTime: "2026-10-15T23:30:00.000Z",
        service: { name: "Corte de pelo", duration: 60 },
      }),
    );
    const lines = ics.split("\r\n");

    expect(lines).toContain("DTSTART:20261015T233000Z");
    expect(lines).toContain("DTEND:20261016T003000Z");
  });

  it("escapes commas, semicolons and backslashes in SUMMARY and LOCATION", () => {
    const ics = buildIcsContent(
      makeAppointment({
        service: { name: "Corte; Barba", duration: 30 },
        local: { name: "Salón, Belleza", address: "Calle Falsa 123" },
      }),
    );
    const lines = ics.split("\r\n");

    expect(lines).toContain("SUMMARY:Corte\\; Barba - Salón\\, Belleza");
    expect(lines.some((line) => line.startsWith("LOCATION:Calle Falsa 123"))).toBe(
      true,
    );
  });
});

describe("buildShareText", () => {
  it("includes the business name, service, address and local wall-clock time", () => {
    const text = buildShareText(makeAppointment());

    expect(text).toContain("Peluquería Centro");
    expect(text).toContain("Corte de pelo");
    expect(text).toContain("Av. Siempre Viva 123");
    // 2026-10-15T15:00:00Z in America/Argentina/Buenos_Aires (UTC-3) is 12:00 local, same day.
    expect(text).toContain("12:00");
  });

  it("formats using the appointment's local timezone, not the raw UTC day", () => {
    const text = buildShareText(
      makeAppointment({
        // 02:00 UTC on the 15th is 23:00 on the 14th in Buenos Aires (UTC-3).
        startDateTime: "2026-10-15T02:00:00.000Z",
      }),
    );

    expect(text).toContain("23:00");
    expect(text).toContain("14");
    expect(text).not.toContain("02:00");
  });
});
