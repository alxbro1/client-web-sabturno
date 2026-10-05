import { apiService } from "@/lib/api";
import { formatInTimeZone } from "date-fns-tz";
import { DEFAULT_TIMEZONE } from "@/lib/constants/countries";

/**
 * Cliente de la plantilla mensual de horarios
 * (`backend/src/monthly-schedule/`).
 *
 * Contrato derivado del código real del backend, no de la documentación:
 *
 * - `GET  /locals/:localId/monthly-schedule?employeeId=` lista los meses
 *   configurados e incluye `days[].slots`. Con `employeeId` filtra por
 *   empleado; sin él devuelve TODOS los meses del local (los del local entero
 *   y los de cada empleado), así que el llamador tiene que filtrar por
 *   `employeeId === null` para el alcance "todo el local".
 * - `GET /locals/:localId/monthly-schedule/:year/:month` existe pero el
 *   controller NO acepta `employeeId` y el service busca
 *   `employeeId: null` hardcodeado: sólo sirve para la plantilla del local
 *   entero. Por eso la pantalla usa la lista para resolver el mes en ambos
 *   alcances.
 * - `POST` y `PUT` reciben `employeeId` en el body; `PUT` es el reemplazo
 *   transaccional del mes completo (desactiva el anterior y crea el nuevo).
 * - `DELETE` también es sólo del local entero (mismo `employeeId: null`).
 *
 * `MonthlyScheduleDay.date` viaja como el instante UTC de la medianoche LOCAL
 * del local. Para volver a la clave de calendario `YYYY-MM-DD` hay que
 * formatear en la zona del local, nunca en la del navegador: por eso todos los
 * métodos que reciben `timezone` lo usan en vez de `formatDateOnlyLocal`.
 */

export interface MonthlyScheduleSlot {
  id: string;
  /** "HH:mm", 24h. */
  startTime: string;
  /** "HH:mm", 24h. Siempre posterior a `startTime`. */
  endTime: string;
}

/** Día tal como lo devuelve el backend. */
export interface MonthlyScheduleDay {
  id: string;
  /** Clave de calendario local del local: "YYYY-MM-DD". */
  date: string;
  isClosed: boolean;
  slots: MonthlyScheduleSlot[];
}

export interface MonthlyScheduleTemplate {
  id: string;
  localId: string;
  /** `null` = plantilla de todo el local. */
  employeeId: string | null;
  year: number;
  month: number;
  isActive: boolean;
  days: MonthlyScheduleDay[];
}

/** Payload de un día: `date` es el día LOCAL en formato "YYYY-MM-DD". */
export interface MonthlyScheduleDayInput {
  date: string;
  isClosed?: boolean;
  slots: { startTime: string; endTime: string }[];
}

export interface SaveMonthlyScheduleRequest {
  year: number;
  month: number;
  /** Omitir o `null` = plantilla de todo el local. */
  employeeId?: string | null;
  days: MonthlyScheduleDayInput[];
}

export interface ReplaceMonthlyScheduleRequest {
  employeeId?: string | null;
  days: MonthlyScheduleDayInput[];
}

export interface RemoveMonthlyScheduleResult {
  deleted: boolean;
  year: number;
  month: number;
}

interface RawSlot {
  id?: string;
  startTime?: string;
  endTime?: string;
}

interface RawDay {
  id?: string;
  date?: string;
  isClosed?: boolean;
  slots?: RawSlot[] | null;
}

interface RawTemplate {
  id?: string;
  localId?: string;
  employeeId?: string | null;
  year?: number;
  month?: number;
  isActive?: boolean;
  days?: RawDay[] | null;
}

/**
 * Convierte el instante UTC de la medianoche local del local a la clave de
 * calendario "YYYY-MM-DD" en la zona del local. Formatear en la zona del
 * navegador corrimiría el día en los casos de backend y dispositivo en zonas
 * distintas.
 */
export function monthlyScheduleDayKey(
  utcDateString: string,
  timezone: string = DEFAULT_TIMEZONE,
): string {
  return formatInTimeZone(utcDateString, timezone, "yyyy-MM-dd");
}

function normalizeTemplate(
  raw: RawTemplate,
  timezone: string,
): MonthlyScheduleTemplate {
  return {
    id: raw.id ?? "",
    localId: raw.localId ?? "",
    employeeId: raw.employeeId ?? null,
    year: raw.year ?? 0,
    month: raw.month ?? 0,
    isActive: raw.isActive ?? true,
    days: (raw.days ?? []).map((day) => ({
      id: day.id ?? "",
      date: day.date ? monthlyScheduleDayKey(day.date, timezone) : "",
      isClosed: day.isClosed ?? false,
      slots: (day.slots ?? []).map((slot) => ({
        id: slot.id ?? "",
        startTime: slot.startTime ?? "",
        endTime: slot.endTime ?? "",
      })),
    })),
  };
}

function isNotFound(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 404;
}

/**
 * Todas las claves "YYYY-MM-DD" del mes, en orden. Construye cada `Date` con
 * `new Date(year, month - 1, day)`, nunca con `new Date("YYYY-MM-DD")` (que es
 * medianoche UTC y corre el día un día en zonas con offset negativo).
 */
export function buildMonthDayKeys(year: number, month: number): string[] {
  const totalDays = new Date(year, month, 0).getDate();
  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
}

/**
 * Busca el mes dentro del listado. `employeeScope` ausente o `null` matchea la
 * plantilla de todo el local; con id, la de ese empleado.
 */
export function findMonthlyScheduleMonth(
  templates: MonthlyScheduleTemplate[],
  year: number,
  month: number,
  employeeScope?: string | null,
): MonthlyScheduleTemplate | null {
  // `||` y no `??`: un `<select>` sin selección devuelve `""`, que NO es
  // nullish. Con `??` el alcance "todo el local" buscaba `employeeId === ""`,
  // no encontraba el template del local y la pantalla decía que el mes no
  // estaba configurado cuando sí lo estaba.
  const wantedEmployee = employeeScope || null;
  return (
    templates.find(
      (template) =>
        template.year === year &&
        template.month === month &&
        (template.employeeId ?? null) === wantedEmployee,
    ) ?? null
  );
}

export const monthlyScheduleService = {
  /**
   * A diferencia de otros listados del repo, acá el error NO se traga en `[]`:
   * la pantalla necesita distinguir "este mes no está configurado" de "no pude
   * leer los meses". Devolver `[]` ante un fallo de red haría creer al dueño
   * que su plantilla no existe, y un guardado lo pisaría. El error sube y la UI
   * lo muestra con su reintento.
   */
  listMonths: async (
    localId: string,
    employeeId?: string,
    timezone: string = DEFAULT_TIMEZONE,
  ): Promise<MonthlyScheduleTemplate[]> => {
    try {
      const response = await apiService.get<RawTemplate[]>(
        `/locals/${localId}/monthly-schedule`,
        employeeId ? { params: { employeeId } } : undefined,
      );
      const data = response.data;
      return (Array.isArray(data) ? data : []).map((raw) =>
        normalizeTemplate(raw, timezone),
      );
    } catch (error) {
      console.error("Error fetching monthly schedules:", error);
      throw error;
    }
  },

  /**
   * Sólo plantilla de todo el local: el backend no acepta `employeeId` en esta
   * ruta. `null` = mes sin configurar (404), `undefined` = error de red o 5xx.
   */
  getMonth: async (
    localId: string,
    year: number,
    month: number,
    timezone: string = DEFAULT_TIMEZONE,
  ): Promise<MonthlyScheduleTemplate | null> => {
    try {
      const response = await apiService.get<RawTemplate>(
        `/locals/${localId}/monthly-schedule/${year}/${month}`,
      );
      return normalizeTemplate(response.data, timezone);
    } catch (error) {
      if (isNotFound(error)) return null;
      console.error("Error fetching monthly schedule:", error);
      throw error;
    }
  },

  create: async (
    localId: string,
    data: SaveMonthlyScheduleRequest,
    timezone: string = DEFAULT_TIMEZONE,
  ): Promise<MonthlyScheduleTemplate> => {
    const response = await apiService.post<RawTemplate>(
      `/locals/${localId}/monthly-schedule`,
      data,
    );
    return normalizeTemplate(response.data, timezone);
  },

  replaceMonth: async (
    localId: string,
    year: number,
    month: number,
    data: ReplaceMonthlyScheduleRequest,
    timezone: string = DEFAULT_TIMEZONE,
  ): Promise<MonthlyScheduleTemplate> => {
    const response = await apiService.put<RawTemplate>(
      `/locals/${localId}/monthly-schedule/${year}/${month}`,
      data,
    );
    return normalizeTemplate(response.data, timezone);
  },

  /** Sólo plantilla de todo el local (el backend no acepta `employeeId`). */
  removeMonth: async (
    localId: string,
    year: number,
    month: number,
  ): Promise<RemoveMonthlyScheduleResult> => {
    const response = await apiService.delete<RemoveMonthlyScheduleResult>(
      `/locals/${localId}/monthly-schedule/${year}/${month}`,
    );
    return response.data;
  },
};
