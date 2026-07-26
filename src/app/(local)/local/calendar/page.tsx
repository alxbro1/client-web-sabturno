"use client";

import { useCallback, useMemo, useState } from "react";
import {
  dateFnsLocalizer,
  type View,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, endOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import { CalendarDays, Ban, CalendarRange, List } from "lucide-react";
import { Button } from "@/components/Button";
import { LocalNavCard } from "@/components/local/LocalNavCard";
import { useAuth } from "@/hooks/useAuth";
import { useTimelineData } from "@/features/appointment-timeline/hooks/useTimelineData";
import { useEmployees } from "@/features/appointment-timeline/hooks/useEmployees";
import type { Appointment, Block } from "@/features/appointment-timeline/types";
import ShadcnBigCalendar from "@/components/shadcn-big-calendar/shadcn-big-calendar";
import "@/components/shadcn-big-calendar/shadcn-big-calendar.css";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { CalendarEventComponent } from "@/components/CalendarEventComponent";
import { AppointmentList } from "@/components/local/AppointmentList";
import { AppointmentDetailsDialog } from "@/components/local/AppointmentDetailsDialog";
import { timelineService } from "@/services/timeline";

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

export default function LocalCalendarPage() {
  const { user } = useAuth();
  const [displayMode, setDisplayMode] = useState<"calendar" | "list">("calendar");
  const [date, setDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>(Views.DAY);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const entityId = user?.id ?? "";

  const dateRange = useMemo(() => {
    if (calendarView === Views.WEEK) {
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    }
    return { start: date, end: date };
  }, [date, calendarView]);

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
    dateRange,
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

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.isBlock || !event.resource || !("status" in event.resource)) {
      return;
    }
    setMutationError(null);
    setSelectedAppointment(event.resource);
  }, []);

  const refreshAllAppointments = useCallback(async () => {
    await refetch();
    setListRefreshKey((key) => key + 1);
  }, [refetch]);

  const handleConfirmAppointment = useCallback(
    async (appointment: Appointment) => {
      if (isMutating) return;
      setIsMutating(true);
      setMutationError(null);
      try {
        await timelineService.confirmCashInFrontAppointment(appointment.id);
        setSelectedAppointment((current) =>
          current?.id === appointment.id
            ? { ...current, status: "CONFIRMED" }
            : current,
        );
        await refreshAllAppointments();
      } catch (error) {
        console.error("Error al confirmar el turno:", error);
        setMutationError("No se pudo confirmar el turno. Intentá nuevamente.");
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [isMutating, refreshAllAppointments],
  );

  const handleCancelAppointment = useCallback(
    async (appointment: Appointment) => {
      if (isMutating) return;
      setIsMutating(true);
      setMutationError(null);
      try {
        await timelineService.cancelAppointment(appointment.id);
        setSelectedAppointment((current) =>
          current?.id === appointment.id
            ? { ...current, status: "CANCELLED" }
            : current,
        );
        await refreshAllAppointments();
      } catch (error) {
        console.error("Error al cancelar el turno:", error);
        setMutationError("No se pudo cancelar el turno. Intentá nuevamente.");
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [isMutating, refreshAllAppointments],
  );

  const min = new Date(2025, 0, 1, 8, 0);
  const max = new Date(2025, 0, 1, 20, 0);

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Calendario
          </p>
          <h2 className="text-2xl font-bold text-white">Turnos del local</h2>
        </div>
        <div
          className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.035] p-1"
          role="tablist"
          aria-label="Modo de visualización"
        >
          <button
            type="button"
            role="tab"
            aria-selected={displayMode === "calendar"}
            onClick={() => setDisplayMode("calendar")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f068] ${
              displayMode === "calendar"
                ? "bg-[#00f068] text-black"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <CalendarRange className="size-4" />
            Calendario
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={displayMode === "list"}
            onClick={() => setDisplayMode("list")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f068] ${
              displayMode === "list"
                ? "bg-[#00f068] text-black"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <List className="size-4" />
            Lista
          </button>
        </div>
      </header>

      <article className="border border-white/12 rounded-[28px] backdrop-blur-[12px] p-0 overflow-hidden min-h-[500px]">
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
            <div className="flex min-w-0 min-h-0 flex-1">
              {displayMode === "calendar" ? (
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
                  onSelectEvent={handleSelectEvent}
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
                  style={{ height: "100%", width: "100%" }}
                />
              ) : (
                <AppointmentList
                  localId={entityId}
                  selectedEmployeeId={selectedEmployeeId}
                  refreshKey={listRefreshKey}
                  onSelect={(appointment) => {
                    setMutationError(null);
                    setSelectedAppointment(appointment);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </article>

      <section className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <LocalNavCard
          to="/local/schedules"
          title="Horarios"
          description="Configurar plantilla de horarios semanal"
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <LocalNavCard
          to="/local/blockings"
          title="Bloqueos"
          description="Bloquear dias y franjas horarias"
          icon={
            <Ban className="w-5 h-5" />
          }
        />
      </section>

      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        resources={resources}
        isMutating={isMutating}
        mutationError={mutationError}
        onClose={() => {
          setSelectedAppointment(null);
          setMutationError(null);
        }}
        onConfirm={handleConfirmAppointment}
        onCancel={handleCancelAppointment}
      />
    </section>
  );
}
