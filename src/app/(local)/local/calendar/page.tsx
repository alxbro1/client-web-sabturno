"use client";

import { useCallback, useMemo, useState } from "react";
import {
  dateFnsLocalizer,
  type View,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import { Button } from "@/components/Button";
import { LocalNavCard } from "@/components/local/LocalNavCard";
import { useAuthStore } from "@/stores/auth";
import { useTimelineData } from "@/features/appointment-timeline/hooks/useTimelineData";
import { useEmployees } from "@/features/appointment-timeline/hooks/useEmployees";
import type { Appointment, Block } from "@/features/appointment-timeline/types";
import ShadcnBigCalendar from "@/components/shadcn-big-calendar/shadcn-big-calendar";
import "@/components/shadcn-big-calendar/shadcn-big-calendar.css";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { CalendarEventComponent } from "@/components/CalendarEventComponent";

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
  event: "Turno",
  noEventsInRange: "No hay turnos en este rango.",
  showMore: (total: number) => `+ Ver ${total} más`,
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource?: Appointment | Block;
  isBlock?: boolean;
  resourceId?: string;
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V10h14v9zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
    </svg>
  );
}

export default function LocalCalendarPage() {
  const { user } = useAuthStore();
  const [date, setDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>(Views.DAY);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );

  const entityId = user?.id ?? "";

  const { employees } = useEmployees({
    localId: entityId,
    enabled: !!entityId,
  });

  const {
    appointments,
    blocks,
    resources,
    isLoading,
    refetch,
  } = useTimelineData({
    entityId,
    date,
    enabled: !!entityId,
    employees,
  });

  const employeeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    resources.forEach((r) => {
      map[r.id] = r.color || "#3daaf4";
    });
    return map;
  }, [resources]);

  const filteredAppointments = useMemo(
    () =>
      selectedEmployeeId
        ? appointments.filter((a) => a.resourceId === selectedEmployeeId)
        : appointments,
    [appointments, selectedEmployeeId]
  );

  const filteredBlocks = useMemo(
    () =>
      selectedEmployeeId
        ? blocks.filter((b) => b.resourceId === selectedEmployeeId)
        : blocks,
    [blocks, selectedEmployeeId]
  );

  const events = useMemo<CalendarEvent[]>(() => {
    const aptEvents: CalendarEvent[] = filteredAppointments.map((a) => ({
      id: a.id,
      title: `${format(a.startAt, "HH:mm")} ${a.title}`,
      start: a.startAt,
      end: a.endAt,
      allDay: false,
      resource: a,
      resourceId: a.resourceId,
    }));

    const blockEvents: CalendarEvent[] = filteredBlocks.map((b) => ({
      id: b.id,
      title: b.notes || "Bloqueado",
      start: b.startAt,
      end: b.endAt,
      allDay: false,
      resource: b,
      isBlock: true,
      resourceId: b.resourceId,
    }));

    return [...aptEvents, ...blockEvents];
  }, [filteredAppointments, filteredBlocks]);

  const appointmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach((a) => {
      counts[a.resourceId] = (counts[a.resourceId] || 0) + 1;
    });
    return counts;
  }, [appointments]);

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => {
      if (event.isBlock) {
        return { className: "event-variant-blocked" };
      }

      if (!selectedEmployeeId && event.resourceId) {
        const color = employeeColorMap[event.resourceId];
        if (color) {
          return {
            style: {
              backgroundColor: color,
              borderColor: color,
            },
          };
        }
      }

      const apt = event.resource as Appointment | undefined;
      if (apt && "status" in apt) {
        const statusClass = `event-variant-${apt.status.toLowerCase()}`;
        return { className: statusClass };
      }

      return {};
    },
    [selectedEmployeeId, employeeColorMap]
  );

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((view: View) => {
    setCalendarView(view);
  }, []);

  const min = new Date(2025, 0, 1, 8, 0);
  const max = new Date(2025, 0, 1, 20, 0);

  return (
    <section className="grid gap-6">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Calendario
          </p>
          <h2 className="text-2xl font-bold text-white">Turnos del local</h2>
        </div>
        <Button variant="secondary" onClick={() => setDate(new Date())}>
          Hoy
        </Button>
      </header>

      <article className="border border-white/12 rounded-[28px] backdrop-blur-[12px] p-6 overflow-hidden min-h-[500px]">
        {!user ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-white/50">
              Iniciá sesion para ver el calendario
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-white/50 animate-pulse">Cargando...</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 h-[650px]">
            <EmployeeSidebar
              resources={resources}
              selectedId={selectedEmployeeId}
              onSelect={setSelectedEmployeeId}
              appointmentCounts={appointmentCounts}
            />
            <div className="flex-1 min-w-0 min-h-0">
              <ShadcnBigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                allDayAccessor="allDay"
                views={[Views.DAY, Views.WEEK]}
                view={calendarView}
                date={date}
                onNavigate={handleNavigate}
                onView={handleViewChange}
                messages={messages}
                culture="es"
                eventPropGetter={eventPropGetter}
                components={{
                  event: CalendarEventComponent,
                }}
                min={min}
                max={max}
                step={30}
                timeslots={1}
                style={{ height: "100%" }}
              />
            </div>
          </div>
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
