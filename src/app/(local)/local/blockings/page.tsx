"use client";

import { useCallback, useMemo, useState } from "react";
import { dateFnsLocalizer, type SlotInfo, type View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import { Button } from "@/components/Button";
import { useLocalCalendarQuery } from "@/hooks/queries/useLocalCalendarQuery";
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
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

export default function LocalBlockingsPage() {
  const {
    blockedDates,
    isLoading,
    blockDate,
    unblockDate,
    currentMonth,
    currentYear,
    setMonth,
  } = useLocalCalendarQuery();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BlockingFormData>({
    type: "full-day",
    date: "",
    notes: "",
  });
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
        setFormData({ type: "full-day", date: dateStr, notes: "" });
      } else {
        const startTime = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
        const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
        setFormData({
          type: "time-slot",
          date: dateStr,
          startTime,
          endTime,
          notes: "",
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
        startDate = new Date(formData.date);
        endDate = new Date(formData.date);
      }
      await blockDate(startDate, endDate, formData.notes);
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
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
          Configuracion
        </p>
        <h2 className="text-2xl font-bold text-white">
          Bloqueos de calendario
        </h2>
      </header>

        {isLoading ? (
          <div className="h-[650px] flex items-center justify-center">
            <div className="text-white/60">Cargando calendario...</div>
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
                  <p className="text-white font-medium">
                    {block.startDate.toDateString() ===
                    block.endDate.toDateString()
                      ? block.type === "time-slot" && block.startTime && block.endTime
                        ? `${formatDate(block.startDate)} \u00b7 ${block.startTime} - ${block.endTime}`
                        : formatDate(block.startDate)
                      : `${formatDate(block.startDate)} - ${formatDate(block.endDate)}`}
                  </p>
                  {block.reason && (
                    <p className="text-sm text-white/50">{block.reason}</p>
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

            <p className="text-white/60 mb-4">
              {formData.date &&
                formatDate(new Date(formData.date + "T12:00:00"))}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
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
                        ? "border-[#00f068]/40 bg-[#00f068]/10 text-white"
                        : "border-white/10 text-white/60"
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
                        ? "border-[#00f068]/40 bg-[#00f068]/10 text-white"
                        : "border-white/10 text-white/60"
                    }`}
                  >
                    Franja horaria
                  </button>
                </div>
              </div>

              {formData.type === "time-slot" && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/80 mb-2">
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
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:border-[#00f068]/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/80 mb-2">
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
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:border-[#00f068]/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Ej: Feriado, mantenimiento..."
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50"
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
