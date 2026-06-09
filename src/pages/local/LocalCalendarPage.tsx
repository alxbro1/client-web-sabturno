import { useState } from "react";
import { Button } from "@/components/Button";
import { LocalNavCard } from "@/components/local/LocalNavCard";
import { useAuthStore } from "@/stores/auth";
import { AppointmentTimeline } from "@/features/appointment-timeline/components/AppointmentTimeline";
import { useTimelineData } from "@/features/appointment-timeline/hooks/useTimelineData";
import { useTimelineActions } from "@/features/appointment-timeline/hooks/useTimelineActions";
import { useEmployees } from "@/features/appointment-timeline/hooks/useEmployees";
import type { ViewMode, Appointment } from "@/features/appointment-timeline/types";

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V10h14v9zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
    </svg>
  );
}

export function LocalCalendarPage() {
  const { user } = useAuthStore();
  const [date, setDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const entityId = user?.id ?? "";

  const { employees } = useEmployees({ localId: entityId, enabled: !!entityId });
  const { appointments, blocks, resources, isLoading, error, refetch } = useTimelineData({
    entityId,
    date,
    viewMode,
    enabled: !!entityId,
    employees,
  });

  const { blockSlot, unblockSlot } = useTimelineActions({
    localId: entityId,
    onSuccess: refetch,
    onError: (msg) => console.error(msg),
  });

  const config = { slotDuration: 30 as const, startHour: 8, endHour: 20 };

  const handleAppointmentClick = (appointment: Appointment) => {
    console.log("Appointment clicked:", appointment);
  };

  const handleGoToToday = () => setDate(new Date());

  return (
    <section className="grid gap-6">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Calendario</p>
          <h2 className="text-2xl font-bold text-white">Turnos del local</h2>
        </div>
        <Button variant="secondary" onClick={handleGoToToday}>
          Hoy
        </Button>
      </header>

      <article className="border border-white/12 rounded-[28px] backdrop-blur-[12px] p-6 overflow-hidden h-full min-h-[500px]">
        {!user ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-white/50">Iniciá sesión para ver el calendario</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-white/50 animate-pulse">Cargando...</p>
          </div>
        ) : (
          <AppointmentTimeline
            date={date}
            resources={resources}
            appointments={appointments}
            blocks={blocks}
            config={config}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onDateChange={setDate}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
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