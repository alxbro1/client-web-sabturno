import { parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale/es";
import { DEFAULT_TIMEZONE } from "@/lib/constants/countries";

const ARS_CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
});

export function convertLocalToUTC(localDate: Date, timezone = DEFAULT_TIMEZONE) {
  return fromZonedTime(localDate, timezone).toISOString();
}

export function formatDateOnlyLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnlyToLocal(dateOnly: string) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function formatLocalDate(
  utcDateString: string,
  timezone = DEFAULT_TIMEZONE,
  formatString = "dd/MM/yyyy HH:mm",
) {
  try {
    return formatInTimeZone(utcDateString, timezone, formatString, {
      locale: es,
    });
  } catch {
    return "Fecha invalida";
  }
}

export function getFriendlyDateTime(utcDateString: string, timezone = DEFAULT_TIMEZONE) {
  return formatLocalDate(utcDateString, timezone, "EEEE HH:mm 'hs'");
}

export function formatCurrency(amount: number) {
  return ARS_CURRENCY_FORMATTER.format(amount);
}

export function toDate(utcDateString: string, timezone = DEFAULT_TIMEZONE) {
  return toZonedTime(parseISO(utcDateString), timezone);
}

export function utcDateTimeToLocalParts(
  utcDate: string,
  utcTime: string,
  timezone = DEFAULT_TIMEZONE,
): { date: string; time: string } {
  const utcDateTime = `${utcDate}T${utcTime}:00Z`;
  return {
    date: formatInTimeZone(utcDateTime, timezone, "yyyy-MM-dd"),
    time: formatInTimeZone(utcDateTime, timezone, "HH:mm"),
  };
}