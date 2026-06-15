"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { useLocalCalendarQuery } from "@/hooks/queries/useLocalCalendarQuery";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type BlockingType = "full-day" | "time-slot";

interface BlockingFormData {
  type: BlockingType;
  date: string;
  startTime?: string;
  endTime?: string;
  notes: string;
}

export default function LocalBlockingsPage() {
  const {
    calendarDays,
    currentMonth,
    currentYear,
    isLoading,
    blockedDates,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
    blockDate,
    unblockDate,
  } = useLocalCalendarQuery();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BlockingFormData>({
    type: "full-day",
    date: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  function handleDayClick(date: Date) {
    const dateStr = date.toISOString().split("T")[0];
    const existingBlock = blockedDates.find((b) => {
      const start = new Date(b.startDate).toISOString().split("T")[0];
      const end = new Date(b.endDate).toISOString().split("T")[0];
      return dateStr >= start && dateStr <= end;
    });

    if (existingBlock?.id) {
      setDeleteId(existingBlock.id || "");
    } else {
      setSelectedDate(date);
      setFormData({ type: "full-day", date: dateStr, notes: "" });
      setShowForm(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);
    try {
      const startDate = new Date(formData.date);
      const endDate =
        formData.type === "full-day"
          ? new Date(formData.date)
          : new Date(formData.date);

      await blockDate(startDate, endDate, formData.notes);
      setShowForm(false);
      setSelectedDate(null);
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

  return (
    <section className="grid gap-6">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Configuracion
          </p>
          <h2 className="text-2xl font-bold text-white">
            Bloqueos de calendario
          </h2>
        </div>
        <Button variant="secondary" onClick={goToToday}>
          Hoy
        </Button>
      </header>

      <article className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-[#00f068]/30 transition-all"
          >
            <IconChevronLeft />
          </button>
          <h3 className="text-xl font-bold text-white">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-[#00f068]/30 transition-all"
          >
            <IconChevronRight />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[0.75rem] font-semibold text-white/50 uppercase tracking-wider py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const isToday =
              day.date.toDateString() === new Date().toDateString();
            const isCurrentMonthDay = day.date.getMonth() === currentMonth;
            const isSelected =
              selectedDate?.toDateString() === day.date.toDateString();

            return (
              <button
                key={idx}
                onClick={() => isCurrentMonthDay && handleDayClick(day.date)}
                disabled={!isCurrentMonthDay}
                className={`
                  relative min-h-[60px] p-2 rounded-xl border transition-all text-left
                  ${isCurrentMonthDay
                    ? day.isBlocked
                      ? "bg-[#ff5678]/20 border-[#ff5678]/40 cursor-pointer hover:bg-[#ff5678]/30"
                      : "bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 hover:border-white/20"
                    : "bg-transparent border-transparent cursor-default opacity-30"}
                  ${isToday ? "ring-2 ring-[#00f068]/50" : ""}
                  ${isSelected ? "ring-2 ring-[#00f068]" : ""}
                `}
              >
                <span
                  className={`text-sm font-medium ${isCurrentMonthDay ? "text-white" : "text-white/40"}`}
                >
                  {day.date.getDate()}
                </span>
                {day.isBlocked && isCurrentMonthDay && (
                  <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#ff5678]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white/5 border border-white/10" />
            <span className="text-[0.7rem] text-white/60">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#ff5678]/20 border border-[#ff5678]/40" />
            <span className="text-[0.7rem] text-white/60">Bloqueado</span>
          </div>
        </div>
      </article>

      {blockedDates.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">
            Bloqueos activos
          </h3>
          <div className="grid gap-2">
            {blockedDates.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[#ff5678]/20 bg-[#ff5678]/5"
              >
                <div>
                  <p className="text-white font-medium">
                    {new Date(block.startDate).toDateString() ===
                    new Date(block.endDate).toDateString()
                      ? formatDate(new Date(block.startDate))
                      : `${formatDate(new Date(block.startDate))} - ${formatDate(new Date(block.endDate))}`}
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

            {selectedDate && (
              <p className="text-white/60 mb-4">{formatDate(selectedDate)}</p>
            )}

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
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Ej: Feriado, mantenimiento..."
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedDate(null);
                  }}
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
        description="Esta seguro de que desea desbloquear esta fecha? Los turnos bloqueados volveran a estar disponibles."
        confirmLabel="Desbloquear"
        isDangerous={false}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId("")}
      />
    </section>
  );
}
