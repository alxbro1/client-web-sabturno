"use client";

import { useCallback, useMemo, useState } from "react";
import { dateFnsLocalizer, type SlotInfo, type View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import { Button } from "@/components/Button";
import { SelectField } from "@/components/Field";
import { useLocalCalendarQuery } from "@/hooks/queries/useLocalCalendarQuery";
import { useEmployeesQuery } from "@/hooks/queries/useEmployeesQuery";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import ShadcnBigCalendar from "@/components/shadcn-big-calendar/shadcn-big-calendar";
import "@/components/shadcn-big-calendar/shadcn-big-calendar.css";

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  allDay: "Todo el día",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "No hay eventos en este rango.",
  showMore: (total: number) => `+ Ver ${total} más`,
};

type BlockingType = "full-day" | "time-slot";

interface BlockingFormData {
  type: BlockingType;
  date: string;
  startTime?: string;
  endTime?: string;
  notes: string;
  /** "" = todo el local. */
  employeeId: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

export default function LocalBlockingsPage() {
  const { user } = useAuth();
  const localId = user?.id ?? "";
  const { employees } = useEmployeesQuery(localId);
  const [filterEmployeeId, setFilterEmployeeId] = useState("");

  const {
    blockedDates,
    isLoading,
    blockDate,
    unblockDate,
    currentMonth,
    currentYear,
    setMonth,
  } = useLocalCalendarQuery(filterEmployeeId || undefined);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BlockingFormData>({
    type: "full-day",
    date: "",
    notes: "",
    employeeId: "",
  });

  function employeeLabel(employeeId?: string | null): string {
    if (!employeeId) return "Todo el local";
    return employees.find((e) => e.id === employeeId)?.name || "Empleado";
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH);
  const calendarDate = useMemo(
    () => new Date(currentYear, currentMonth, 1),
    [currentMonth, currentYear],
  );

  const events = useMemo<CalendarEvent[]>(() => {
    return blockedDates.map((block) => {
      const isSameDay = block.startDate.toDateString() === block.endDate.toDateString();
      const title = isSameDay
        ? block.type === "time-slot" && block.startTime && block.endTime
          ? `Bloqueado ${block.startTime}-${block.endTime}`
          : "Bloqueado"
        : `Bloqueado: ${block.reason || "rango"}`;
      return {
        id: block.id || "",
        title,
        start: block.startDate,
        end: block.endDate,
        allDay: true,
      };
    });
  }, [blockedDates]);

  const eventPropGetter = useCallback(() => {
    return { className: "event-variant-blocked" };
  }, []);

  const handleNavigate = useCallback((newDate: Date, view: View) => {
    setMonth(newDate);
    setCalendarView(view);
  }, [setMonth]);

  const handleViewChange = useCallback((view: View) => {
    setCalendarView(view);
  }, []);

  function handleSelectSlot(slotInfo: SlotInfo) {
    const dateStr = slotInfo.start.toISOString().split("T")[0];
    const existingBlock = blockedDates.find((b) => {
      const start = b.startDate.toISOString().split("T")[0];
      const end = b.endDate.toISOString().split("T")[0];
      return dateStr >= start && dateStr <= end;
    });
    if (existingBlock?.id) {
      setDeleteId(existingBlock.id);
    } else {
      // Detectar si el usuario seleccionó un rango horario específico
      // o un día completo (vista mes: start y end a medianoche)
      const startHour = slotInfo.start.getHours();
      const startMin = slotInfo.start.getMinutes();
      const endHour = slotInfo.end.getHours();
      const endMin = slotInfo.end.getMinutes();
      const isFullDay =
        startHour === 0 &&
        startMin === 0 &&
        ((endHour === 0 && endMin === 0) || endHour === 23);

      if (isFullDay) {
        setFormData({ type: "full-day", date: dateStr, notes: "", employeeId: "" });
      } else {
        const startTime = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
        const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
        setFormData({
          type: "time-slot",
          date: dateStr,
          startTime,
          endTime,
          notes: "",
          employeeId: "",
        });
      }
      setShowForm(true);
    }
  }

  function handleSelectEvent(event: CalendarEvent) {
    if (event.id) {
      setDeleteId(event.id);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validaciones (alineadas con la app móvil)
    if (!formData.date) {
      return;
    }

    if (formData.type === "time-slot") {
      if (!formData.startTime || !formData.endTime) {
        return;
      }
      if (formData.startTime >= formData.endTime) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let startDate: Date;
      let endDate: Date;
      if (
        formData.type === "time-slot" &&
        formData.startTime &&
        formData.endTime
      ) {
        startDate = new Date(`${formData.date}T${formData.startTime}:00`);
        endDate = new Date(`${formData.date}T${formData.endTime}:00`);
      } else {
        // Día completo: solo fecha, sin horas específicas
        const [y, m, d] = formData.date.split("-").map(Number);
        startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
        endDate = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      await blockDate(
        startDate,
        endDate,
        formData.notes,
        formData.employeeId || undefined,
      );
      setShowForm(false);
    } catch (err) {
      console.error("Error blocking date:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await unblockDate(deleteId);
      setDeleteId("");
    } catch (err) {
      console.error("Error unblocking date:", err);
    } finally {
      setIsDeleting(false);
    }
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  const deleteTarget = blockedDates.find((b) => b.id === deleteId);

  return (
    <section className="grid gap-6">
      <header>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-primary">
          Configuracion
        </p>
        <h2 className="text-2xl font-bold text-white">
          Bloqueos de calendario
        </h2>
      </header>

      {employees.length > 0 && (
        <div className="max-w-xs">
          <SelectField
            label="Filtrar por empleado"
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
            hint="Muestra los bloqueos de todo el local mas los del empleado elegido."
          >
            <option value="">Todos</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </SelectField>
        </div>
      )}

        {isLoading ? (
          <div className="h-[650px] flex items-center justify-center">
            <div className="text-muted-foreground">Cargando calendario...</div>
          </div>
        ) : (
          <ShadcnBigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            allDayAccessor="allDay"
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            view={calendarView}
            date={calendarDate}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            messages={messages}
            culture="es"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            style={{ height: 650 }}
          />
        )}

      {blockedDates.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">
            Bloqueos activos ({blockedDates.length})
          </h3>
          <div className="grid gap-2">
            {blockedDates.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[#ff5678]/20 bg-[#ff5678]/5"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium">
                      {block.startDate.toDateString() ===
                      block.endDate.toDateString()
                        ? block.type === "time-slot" && block.startTime && block.endTime
                          ? `${formatDate(block.startDate)} \u00b7 ${block.startTime} - ${block.endTime}`
                          : formatDate(block.startDate)
                        : `${formatDate(block.startDate)} - ${formatDate(block.endDate)}`}
                    </p>
                    {employees.length > 0 && (
                      <span className="rounded-full border border-[#ff5678]/30 bg-[#ff5678]/10 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-[#ff9aae]">
                        {employeeLabel(block.employeeId)}
                      </span>
                    )}
                  </div>
                  {block.reason && (
                    <p className="text-sm text-muted-foreground">{block.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="text-[#ff5678] border-[#ff5678]/30"
                  onClick={() => setDeleteId(block.id || "")}
                >
                  Desbloquear
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="border border-white/12 bg-[#141414] rounded-[28px] shadow-[0_24px_70px_rgba(0,0,0,0.5)] p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              Bloquear fecha
            </h3>

            <p className="text-muted-foreground mb-4">
              {formData.date &&
                formatDate(new Date(formData.date + "T12:00:00"))}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de bloqueo
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, type: "full-day" }))
                    }
                    className={`flex-1 p-3 rounded-xl border transition-all ${
                      formData.type === "full-day"
                        ? "border-primary/40 bg-primary/10 text-white"
                        : "border-white/10 text-muted-foreground"
                    }`}
                  >
                    Dia completo
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, type: "time-slot" }))
                    }
                    className={`flex-1 p-3 rounded-xl border transition-all ${
                      formData.type === "time-slot"
                        ? "border-primary/40 bg-primary/10 text-white"
                        : "border-white/10 text-muted-foreground"
                    }`}
                  >
                    Franja horaria
                  </button>
                </div>
              </div>

              {employees.length > 0 && (
                <SelectField
                  label="Aplica a"
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeId: e.target.value,
                    }))
                  }
                >
                  <option value="">Todo el local</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </SelectField>
              )}

              {formData.type === "time-slot" && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Desde
                    </label>
                    <input
                      type="time"
                      value={formData.startTime || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Hasta
                    </label>
                    <input
                      type="time"
                      value={formData.endTime || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Ej: Feriado, mantenimiento..."
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Bloqueando..." : "Bloquear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Desbloquear fecha"
        description={
          deleteTarget
            ? (() => {
                const sameDay = deleteTarget.startDate.toDateString() === deleteTarget.endDate.toDateString();
                const dateText = sameDay
                  ? deleteTarget.type === "time-slot" && deleteTarget.startTime && deleteTarget.endTime
                    ? `${formatDate(deleteTarget.startDate)} \u00b7 ${deleteTarget.startTime} - ${deleteTarget.endTime}`
                    : formatDate(deleteTarget.startDate)
                  : `${formatDate(deleteTarget.startDate)} - ${formatDate(deleteTarget.endDate)}`;
                return `¿Está seguro de que desea desbloquear ${dateText}? Los turnos bloqueados volverán a estar disponibles.`;
              })()
            : "¿Está seguro de que desea desbloquear esta fecha?"
        }
        confirmLabel="Desbloquear"
        isDangerous={false}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId("")}
      />
    </section>
  );
}
