import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { LocalStatsCard } from "@/components/local/LocalStatsCard";
import { LocalNavCard } from "@/components/local/LocalNavCard";
import { useAuthStore } from "@/stores/auth";
import { formatCurrency } from "@/lib/utils/date";
import { useLocalCalendar } from "@/features/local/hooks/useLocalCalendar";
import { useLocalHome } from "@/features/local/hooks/useLocalHome";

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V10h14v9zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
    </svg>
  );
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  confirmed: { bg: 'bg-[#00f068]/15', text: 'text-[#00f068]', border: 'border-[#00f068]/30' },
  completed: { bg: 'bg-white/5', text: 'text-white/50', border: 'border-white/10' },
  cancelled: { bg: 'bg-[#ff5678]/15', text: 'text-[#ff5678]', border: 'border-[#ff5678]/30' },
};

const dayStatusColors: Record<string, string> = {
  BLOCKED: 'bg-[#ff5678]/20 border-[#ff5678]/40',
  NON_WORKING: 'bg-white/5 border-white/10 opacity-40',
  LOW_TRAFFIC: 'bg-[#00f068]/8 border-[#00f068]/25',
  MEDIUM_TRAFFIC: 'bg-amber-500/15 border-amber-500/35',
  HIGH_TRAFFIC: 'bg-[#ff5678]/15 border-[#ff5678]/35',
  AVAILABLE: 'bg-white/5 border-white/15',
};

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function LocalCalendarPage() {
  const { user } = useAuthStore();
  const {
    calendarDays,
    currentMonth,
    currentYear,
    isLoading,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
    monthStats,
  } = useLocalCalendar();

  const isCurrentMonth = currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

  return (
    <section className="grid gap-6">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Calendario</p>
          <h2 className="text-2xl font-bold text-white">Turnos del local</h2>
        </div>
        <Button variant="secondary" onClick={goToToday}>
          Hoy
        </Button>
      </header>

      <section className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <LocalStatsCard title="Dias lavorables" value={monthStats.workingDays} />
        <LocalStatsCard title="Dias con turnos" value={monthStats.appointmentDays} />
        <LocalStatsCard title="Dias bloqueados" value={monthStats.blockedDays} />
        <LocalStatsCard title="Ocupacion promedio" value={`${monthStats.averageOccupancy}%`} />
      </section>

      <article className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-6 overflow-hidden">
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
            <div key={day} className="text-center text-[0.75rem] font-semibold text-white/50 uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const isToday = day.date.toDateString() === new Date().toDateString();
            const isCurrentMonthDay = day.date.getMonth() === currentMonth;

            return (
              <div
                key={idx}
                className={`
                  relative min-h-[70px] p-2 rounded-xl border transition-all
                  ${isCurrentMonthDay ? dayStatusColors[day.status] || 'bg-white/5 border-white/10' : 'bg-transparent border-transparent opacity-30'}
                  ${isToday ? 'ring-2 ring-[#00f068]/50' : ''}
                `}
              >
                <span className={`text-sm font-medium ${isCurrentMonthDay ? 'text-white' : 'text-white/40'}`}>
                  {day.date.getDate()}
                </span>

                {day.appointmentCount > 0 && isCurrentMonthDay && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Array.from({ length: Math.min(day.appointmentCount, 3) }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-[#00f068]" />
                    ))}
                    {day.appointmentCount > 3 && (
                      <span className="text-[0.6rem] text-white/50">+{day.appointmentCount - 3}</span>
                    )}
                  </div>
                )}

                {day.isBlocked && (
                  <div className="absolute bottom-1 right-1">
                    <div className="w-2 h-2 rounded-full bg-[#ff5678]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#00f068]/8 border border-[#00f068]/25" />
            <span className="text-[0.7rem] text-white/60">Bajo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/15 border border-amber-500/35" />
            <span className="text-[0.7rem] text-white/60">Medio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#ff5678]/15 border border-[#ff5678]/35" />
            <span className="text-[0.7rem] text-white/60">Alto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#ff5678]/20 border border-[#ff5678]/40" />
            <span className="text-[0.7rem] text-white/60">Bloqueado</span>
          </div>
        </div>
      </article>

      <section className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <LocalNavCard
          to="/local/schedules"
          title="Horarios"
          description="Configurar plantilla de horarios semanal"
          icon={<IconCalendar />}
        />
        <LocalNavCard
          to="/local/blockings"
          title="Bloqueos"
          description="Bloquear dias y franjas horarias"
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
            </svg>
          }
        />
      </section>
    </section>
  );
}