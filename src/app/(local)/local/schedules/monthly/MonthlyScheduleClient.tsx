"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { dateFnsLocalizer, Views } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale/es";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import ShadcnBigCalendar from "@/components/shadcn-big-calendar/shadcn-big-calendar";
import "@/components/shadcn-big-calendar/shadcn-big-calendar.css";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/Field";
import { useAuth } from "@/hooks/useAuth";
import { useEmployeesQuery } from "@/hooks/queries/useEmployeesQuery";
import { useMonthlyScheduleQuery } from "@/hooks/queries/useMonthlyScheduleQuery";
import {
  buildMonthDayKeys,
  findMonthlyScheduleMonth,
  type MonthlyScheduleDayInput,
} from "@/features/local/services/monthlySchedule.service";
import {
  formatDateOnlyLocal,
  parseDateOnlyToLocal,
} from "@/lib/utils/date";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface RangeDraft {
  start: string;
  end: string;
}

interface DayDraft {
  isClosed: boolean;
  slots: RangeDraft[];
}

type Drafts = Record<string, DayDraft>;

const CLOSED_DAY: DayDraft = { isClosed: true, slots: [] };

function closedDraftsFor(monthKeys: string[]): Drafts {
  const drafts: Drafts = {};
  for (const key of monthKeys) drafts[key] = { ...CLOSED_DAY, slots: [] };
  return drafts;
}

function minutesOf(hhmm: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function validateDay(day: DayDraft): string[] {
  if (day.isClosed) return [];
  const errors: string[] = [];
  if (day.slots.length === 0) {
    errors.push("Un día abierto necesita al menos una franja horaria.");
  }
  const ranges = day.slots.map((slot, index) => ({
    index,
    start: minutesOf(slot.start),
    end: minutesOf(slot.end),
  }));

  ranges.forEach(({ index, start, end }) => {
    if (start === null || end === null) {
      errors.push(`La franja ${index + 1} tiene un horario inválido.`);
      return;
    }
    if (end <= start) {
      errors.push(
        `La franja ${index + 1} (${slotLabel(day.slots[index])}) termina antes o junto a la hora de inicio.`,
      );
    }
  });

  const valid = ranges.filter((r) => r.start !== null && r.end !== null);
  for (let i = 0; i < valid.length; i += 1) {
    for (let j = i + 1; j < valid.length; j += 1) {
      const a = valid[i];
      const b = valid[j];
      if (a.start! < b.end! && b.start! < a.end!) {
        errors.push(
          `Las franjas ${i + 1} y ${j + 1} se superponen.`,
        );
      }
    }
  }

  return errors;
}

function slotLabel(slot: RangeDraft): string {
  return `${slot.start}-${slot.end}`;
}

/**
 * Acceso a un día del borrador. Existe para que TypeScript no ensanche el
 * `"" | DayDraft` de `selectedDate && drafts[selectedDate]`.
 */
function dayDraft(drafts: Drafts, date: string | null): DayDraft {
  return (date && drafts[date]) || CLOSED_DAY;
}

function readableDate(dateOnly: string): string {
  const date = parseDateOnlyToLocal(dateOnly);
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

export function MonthlyScheduleClient() {
  const { user } = useAuth();
  const localId = user?.id ?? "";

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [scopeEmployeeId, setScopeEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [pendingAction, setPendingAction] = useState<"save" | "remove" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const { employees } = useEmployeesQuery(localId);
  const {
    templates,
    isLoading,
    error,
    refetch,
    saveMonth,
    removeMonth,
    isSaving,
    isRemoving,
  } = useMonthlyScheduleQuery(scopeEmployeeId || undefined);

  const monthKeys = useMemo(() => buildMonthDayKeys(year, month), [year, month]);

  /**
   * `react-big-calendar` no se puede renderizar en el servidor: la grilla del mes
   * depende de la fecha y del locale del runtime, así que el HTML del SSR no
   * coincide con el del cliente. Peor todavía, acá el calendario se renderizaba
   * durante el SSR porque la query nasce deshabilitada (sin sesión no hay
   * `localId`, y una query deshabilitada NO está "cargando"), y al hidratar la
   * sesión la query se habilita, `isLoading` pasa a `true` y React intenta
   * borrar un subárbol que ya no es hijo de su padre:
   * `Failed to execute 'removeChild' on 'Node'`.
   *
   * Recién después del montaje se dibuja el calendario. El gate de `isLoading`
   * solo no alcanza: con la query cacheada volvería a renderizarse en el SSR.
   */
  useEffect(() => setMounted(true), []);

  const monthTemplate = useMemo(
    () => findMonthlyScheduleMonth(templates, year, month, scopeEmployeeId),
    [templates, year, month, scopeEmployeeId],
  );

  // El id del template es un escalar estable: depende de él, no del objeto.
  const templateId = monthTemplate?.id ?? null;
  useEffect(() => {
    const next: Drafts = closedDraftsFor(monthKeys);
    monthTemplate?.days.forEach((day) => {
      next[day.date] = {
        isClosed: day.isClosed,
        slots: day.slots.map((slot) => ({
          start: slot.startTime,
          end: slot.endTime,
        })),
      };
    });
    setDrafts(next);
    setSelectedDate(null);
    setFeedback(null);
  }, [templateId, monthKeys, scopeEmployeeId]);

  const summary = useMemo(() => {
    let open = 0;
    for (const key of monthKeys) {
      if (!dayDraft(drafts, key).isClosed) open += 1;
    }
    return { open, closed: monthKeys.length - open, total: monthKeys.length };
  }, [drafts, monthKeys]);

  const selected = dayDraft(drafts, selectedDate);
  const dayErrors = selectedDate ? validateDay(selected) : [];

  /**
   * Se validan TODOS los días del mes, no sólo el abierto en el editor: si no,
   * un día inválido que quedó en otro día del mes dejaría el botón habilitado y
   * el backend lo rechazaría.
   */
  const invalidDays = monthKeys.filter((key) => validateDay(dayDraft(drafts, key)).length > 0);
  const canSave = monthKeys.length > 0 && invalidDays.length === 0;

  const scopeLabel = scopeEmployeeId
    ? employees?.find((employee) => employee.id === scopeEmployeeId)?.name ??
      "el empleado elegido"
    : "todo el local";

  function shiftMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  }

  function updateSelectedDay(patch: Partial<DayDraft>) {
    if (!selectedDate) return;
    setDrafts((prev) => ({
      ...prev,
      [selectedDate]: { ...(prev[selectedDate] ?? CLOSED_DAY), ...patch },
    }));
  }

  function addSlot() {
    const current = dayDraft(drafts, selectedDate);
    updateSelectedDay({
      isClosed: false,
      slots: [...current.slots, { start: "09:00", end: "13:00" }],
    });
  }

  function updateSlot(index: number, patch: Partial<RangeDraft>) {
    const current = dayDraft(drafts, selectedDate);
    updateSelectedDay({
      slots: current.slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)),
    });
  }

  function removeSlot(index: number) {
    const current = dayDraft(drafts, selectedDate);
    updateSelectedDay({ slots: current.slots.filter((_, i) => i !== index) });
  }

  function buildPayload(): MonthlyScheduleDayInput[] {
    return monthKeys.map((key) => {
      const draft = dayDraft(drafts, key);
      return draft.isClosed
        ? { date: key, isClosed: true, slots: [] }
        : {
            date: key,
            isClosed: false,
            slots: draft.slots.map((slot) => ({
              startTime: slot.start,
              endTime: slot.end,
            })),
          };
    });
  }

  async function handleSave() {
    try {
      await saveMonth({
        year,
        month,
        employeeId: scopeEmployeeId || null,
        days: buildPayload(),
      });
      setPendingAction(null);
      setFeedback({
        kind: "success",
        message: `Guardamos el horario de ${MONTH_NAMES[month - 1]} ${year} para ${scopeLabel}.`,
      });
    } catch (saveError) {
      console.error("Error saving monthly schedule:", saveError);
      setPendingAction(null);
      setFeedback({
        kind: "error",
        message:
          "No pudimos guardar el horario del mes. Revisá los horarios e intentá de nuevo.",
      });
    }
  }

  async function handleRemove() {
    try {
      await removeMonth(year, month);
      setPendingAction(null);
      setFeedback({
        kind: "success",
        message: `El horario de ${MONTH_NAMES[month - 1]} ${year} vuelve al horario semanal.`,
      });
    } catch (removeError) {
      console.error("Error removing monthly schedule:", removeError);
      setPendingAction(null);
      setFeedback({
        kind: "error",
        message: "No pudimos desactivar el horario del mes. Intentá de nuevo.",
      });
    }
  }

  const openDayKeys = monthKeys.filter((key) => !dayDraft(drafts, key).isClosed);

  /**
   * Cada día abierto es un evento de un día completo. `start` y `end` tienen que
   * ser `Date`: con `start === end` y sin `allDay` react-big-calendar calcula
   * una duración inválida y tira al montar el primer evento
   * (la pantalla entera se cae al abrir el primer día).
   */
  const events = openDayKeys.map((key) => {
    const start = parseDateOnlyToLocal(key);
    const end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + 1,
    );
    return { id: key, title: key, start, end, allDay: true };
  });

  return (
    <section className="grid gap-6" data-testid="monthly-schedule">
      <header className="grid gap-2">
        <Link href="/local/schedules" className="w-fit">
          <Button variant="secondary" className="w-fit">
            <ArrowLeft className="size-4" /> Volver a horarios
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Horario por mes</h1>
        <p className="text-sm text-muted-foreground">
          Elegí un mes y marcá día por día si el local atiende y en qué franjas
          horarias. Los días que dejes cerrados no ofrecen turnos.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <fieldset className="grid gap-1.5">
          <legend className="text-sm font-medium text-foreground">Mes</legend>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => shiftMonth(-1)}
              aria-label="Mes anterior"
              className="shrink-0 px-3"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="flex-1 text-center text-sm font-medium capitalize text-foreground">
              {MONTH_NAMES[month - 1]} {year}
            </p>
            <Button
              variant="secondary"
              onClick={() => shiftMonth(1)}
              aria-label="Mes siguiente"
              className="shrink-0 px-3"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </fieldset>

        {!!employees?.length && (
          <div className="max-w-xs">
            <SelectField
              label="Empleado"
              value={scopeEmployeeId}
              onChange={(event) => setScopeEmployeeId(event.target.value)}
              hint=" "
            >
              <option value="">Todo el local</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </SelectField>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="grid gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-foreground">
            No pudimos leer los meses configurados: {error}
          </p>
          <Button variant="secondary" onClick={() => refetch()} className="w-fit">
            Reintentar
          </Button>
        </div>
      )}

      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={
            feedback.kind === "error"
              ? "rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground"
              : "rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground"
          }
        >
          {feedback.message}
        </p>
      )}

      {isLoading || !mounted ? (
        <div className="flex h-[420px] items-center justify-center">
          <p className="text-muted-foreground">Cargando calendario...</p>
        </div>
      ) : (
        <ShadcnBigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          allDayAccessor="allDay"
          titleAccessor="title"
          views={[Views.MONTH]}
          defaultDate={new Date(year, month - 1, 1)}
          key={`${year}-${month}-${scopeEmployeeId}`}
          culture="es"
          selectable
          onSelectSlot={(slot) => setSelectedDate(formatDateOnlyLocal(slot.start as Date))}
          onDrillDown={(date) => setSelectedDate(formatDateOnlyLocal(date))}
          components={{
            event: ({ event }) => (
              <span
                title={`${event.title}: abierto`}
                className="block size-2.5 rounded-full bg-primary"
              />
            ),
          }}
          style={{ height: 420 }}
        />
      )}

      <p className="text-xs text-muted-foreground">
        El punto verde marca los días con horario. Tocá el número del día o el
        espacio de la celda para editar sus franjas horarias.
      </p>

      {selectedDate && (
        <Dialog
          open={!!selectedDate}
          onOpenChange={(open) => {
            if (!open) setSelectedDate(null);
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="max-h-[min(85vh,640px)] overflow-y-auto sm:max-w-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-base capitalize text-foreground">
                {readableDate(selectedDate)}
              </DialogTitle>
              <Button
                variant="ghost"
                onClick={() => setSelectedDate(null)}
                aria-label="Cerrar editor del día"
                className="shrink-0 px-2"
              >
                <X className="size-4" />
              </Button>
            </div>
            <DialogDescription className="sr-only">
              Editá el estado del día y sus franjas horarias.
            </DialogDescription>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-foreground">
                Estado del día
              </legend>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selected.isClosed ? "secondary" : "primary"}
                  aria-pressed={!selected.isClosed}
                  onClick={() =>
                    updateSelectedDay({
                      isClosed: false,
                      slots: selected.slots.length
                        ? selected.slots
                        : [{ start: "09:00", end: "13:00" }],
                    })
                  }
                >
                  Abierto
                </Button>
                <Button
                  variant={selected.isClosed ? "primary" : "secondary"}
                  aria-pressed={selected.isClosed}
                  onClick={() => updateSelectedDay({ isClosed: true, slots: [] })}
                >
                  Cerrado
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Marcar el día como cerrado no cancela los turnos ya reservados: los
                clientes los ven igual y hay que coordinarlos a mano.
              </p>
            </fieldset>

            {!selected.isClosed && (
              <div className="grid gap-3">
                {selected.slots.map((slot, index) => (
                  <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="grid gap-1.5">
                      <label
                        htmlFor={`slot-${selectedDate}-${index}-start`}
                        className="text-sm text-muted-foreground"
                      >
                        Desde (franja {index + 1})
                      </label>
                      <input
                        id={`slot-${selectedDate}-${index}-start`}
                        type="time"
                        value={slot.start}
                        onChange={(event) =>
                          updateSlot(index, { start: event.target.value })
                        }
                        className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label
                        htmlFor={`slot-${selectedDate}-${index}-end`}
                        className="text-sm text-muted-foreground"
                      >
                        Hasta (franja {index + 1})
                      </label>
                      <input
                        id={`slot-${selectedDate}-${index}-end`}
                        type="time"
                        value={slot.end}
                        onChange={(event) =>
                          updateSlot(index, { end: event.target.value })
                        }
                        className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => removeSlot(index)}
                      aria-label={`Quitar franja ${index + 1}`}
                      className="h-11 self-end border border-destructive/30 text-destructive"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}

                <Button variant="secondary" onClick={addSlot} className="w-fit">
                  <Plus className="size-4" />
                  Agregar franja
                </Button>
              </div>
            )}

            {dayErrors.length > 0 && (
              <div role="alert" className="grid gap-1 text-sm text-destructive">
                {dayErrors.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setPendingAction("save")}
          disabled={!canSave || isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar horario del mes"}
        </Button>

        {monthTemplate && !scopeEmployeeId && (
          <Button
            variant="secondary"
            onClick={() => setPendingAction("remove")}
            disabled={isRemoving}
            className="border-destructive/30 text-destructive"
          >
            Desactivar el mes
          </Button>
        )}
      </div>

      {monthTemplate && scopeEmployeeId && (
        <p className="text-xs text-muted-foreground">
          Sólo se puede desactivar el horario del mes de todo el local. Para
          sacar el de un empleado, cambiá el selector y guardá otro mes.
        </p>
      )}

      {/*
        La acción pendiente manda: antes un único booleano compartía el diálogo y
        `Guardar horario del mes` sobre un mes propio de todo el local abría el
        diálogo destructivo con `handleRemove`, o sea que guardar borraba el mes.
      */}
      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={
          pendingAction === "remove"
            ? "Desactivar el horario del mes"
            : `Reemplazar el horario de ${MONTH_NAMES[month - 1]}`
        }
        description={
          pendingAction === "remove"
            ? `Se elimina el horario propio de ${MONTH_NAMES[month - 1]} ${year} y ese mes vuelve a seguir el horario semanal del local.`
            : `Se reemplazan los ${summary.total} días de ${MONTH_NAMES[month - 1]} ${year} para ${scopeLabel}: ${summary.open} abiertos con horario y ${summary.closed} cerrados. Marcar un día cerrado no cancela los turnos ya reservados: los clientes los ven igual y hay que coordinarlos a mano.`
        }
        confirmLabel={pendingAction === "remove" ? "Desactivar" : "Guardar horario"}
        isDangerous={pendingAction === "remove"}
        isLoading={isSaving || isRemoving}
        onConfirm={pendingAction === "remove" ? handleRemove : handleSave}
        onCancel={() => setPendingAction(null)}
      />
    </section>
  );
}