"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronDown, Clock3, UserRound } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale/es";
import { Button } from "@/components/Button";
import { timelineService, type BackendAppointment } from "@/services/timeline";
import { mapBackendAppointment } from "@/features/appointment-timeline/utils/mappers";
import type { Appointment } from "@/features/appointment-timeline/types";

type ListFilter = "upcoming" | "history";

interface AppointmentListProps {
  localId: string;
  selectedEmployeeId: string | null;
  refreshKey: number;
  onSelect: (appointment: Appointment) => void;
}

interface ListState {
  items: BackendAppointment[];
  nextCursor: string | null;
  hasMore: boolean;
}

const EMPTY_STATE: ListState = {
  items: [],
  nextCursor: null,
  hasMore: true,
};

const STATUS_LABELS: Record<Appointment["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_CLASSES: Record<Appointment["status"], string> = {
  PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  CONFIRMED: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  COMPLETED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  CANCELLED: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

function getDisplayTimezone(appointment: Appointment) {
  return (
    appointment.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "America/Argentina/Buenos_Aires"
  );
}

export function AppointmentList({
  localId,
  selectedEmployeeId,
  refreshKey,
  onSelect,
}: AppointmentListProps) {
  const [activeFilter, setActiveFilter] = useState<ListFilter>("upcoming");
  const [states, setStates] = useState<Record<ListFilter, ListState>>({
    upcoming: EMPTY_STATE,
    history: EMPTY_STATE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (filter: ListFilter, reset: boolean) => {
      if (!localId) return;

      reset ? setIsLoading(true) : setIsLoadingMore(true);
      setError(null);

      try {
        const current = states[filter];
        const now = new Date().toISOString();
        const result = await timelineService.getAppointmentsByEntity(localId, {
          cursor: reset ? undefined : current.nextCursor ?? undefined,
          limit: 10,
          status:
            filter === "upcoming"
              ? ["PENDING", "CONFIRMED"]
              : ["COMPLETED", "CANCELLED", "CONFIRMED"],
          ...(filter === "upcoming" ? { minDate: now } : { maxDate: now }),
        });

        setStates((previous) => ({
          ...previous,
          [filter]: {
            items: reset
              ? result.items
              : [
                  ...previous[filter].items,
                  ...result.items.filter(
                    (item) =>
                      !previous[filter].items.some((existing) => existing.id === item.id),
                  ),
                ],
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
          },
        }));
      } catch (fetchError) {
        console.error("Error al cargar la lista de turnos:", fetchError);
        setError("No se pudieron cargar los turnos. Intentá nuevamente.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [localId, states],
  );

  useEffect(() => {
    let isCurrent = true;

    const load = async () => {
      if (!isCurrent) return;
      await fetchPage(activeFilter, true);
    };

    void load();
    return () => {
      isCurrent = false;
    };
    // `fetchPage` lee el estado actual para paginar, pero una actualización de
    // estado no debe reiniciar la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, localId, refreshKey]);

  const appointments = useMemo(() => {
    const mapped = states[activeFilter].items.map((item) =>
      mapBackendAppointment(item, localId),
    );
    const filtered = selectedEmployeeId
      ? mapped.filter((appointment) => appointment.resourceId === selectedEmployeeId)
      : mapped;

    return filtered.toSorted((a, b) =>
      activeFilter === "upcoming"
        ? a.startAt.getTime() - b.startAt.getTime()
        : b.startAt.getTime() - a.startAt.getTime(),
    );
  }, [activeFilter, localId, selectedEmployeeId, states]);

  const currentState = states[activeFilter];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="mx-4 mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-black/25 p-1"
        role="tablist"
        aria-label="Filtrar turnos"
      >
        {([
          ["upcoming", "Próximos"],
          ["history", "Historial"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeFilter === value}
            onClick={() => setActiveFilter(value)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f068] ${
              activeFilter === value
                ? "bg-[#00f068] text-black"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid min-h-64 place-items-center text-sm text-white/50">
            Cargando turnos...
          </div>
        ) : error ? (
          <div className="grid min-h-64 place-items-center gap-3 text-center">
            <p className="max-w-sm text-sm text-[#ff5678]">{error}</p>
            <Button variant="secondary" onClick={() => void fetchPage(activeFilter, true)}>
              Reintentar
            </Button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-center">
            <div>
              <CalendarClock className="mx-auto mb-3 size-8 text-white/30" />
              <p className="font-semibold text-white">
                {activeFilter === "upcoming"
                  ? "No hay turnos próximos"
                  : "No hay turnos en el historial"}
              </p>
              <p className="mt-1 text-sm text-white/45">
                {selectedEmployeeId
                  ? "Probá seleccionando otro profesional."
                  : "Los turnos aparecerán acá cuando estén disponibles."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="grid gap-3 xl:grid-cols-2">
            {appointments.map((appointment) => {
              const timezone = getDisplayTimezone(appointment);
              const dateLabel = formatInTimeZone(
                appointment.startAt,
                timezone,
                "EEEE d 'de' MMMM",
                { locale: es },
              );
              const timeLabel = `${formatInTimeZone(
                appointment.startAt,
                timezone,
                "HH:mm",
              )}–${formatInTimeZone(appointment.endAt, timezone, "HH:mm")}`;

              return (
                <li key={appointment.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(appointment)}
                    className="group w-full rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#00f068]/35 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f068]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                          {appointment.customerName || "Cliente sin nombre"}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-white/55">
                          {appointment.serviceName || "Servicio sin especificar"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${STATUS_CLASSES[appointment.status]}`}
                      >
                        {STATUS_LABELS[appointment.status]}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/65">
                      <span className="flex items-center gap-1.5 capitalize">
                        <CalendarClock className="size-4 text-[#00f068]" />
                        {dateLabel}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="size-4 text-[#00f068]" />
                        {timeLabel}
                      </span>
                      {appointment.resourceId !== localId ? (
                        <span className="flex items-center gap-1.5">
                          <UserRound className="size-4 text-white/40" />
                          Profesional asignado
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!isLoading && !error && currentState.hasMore ? (
          <div className="mt-4 flex justify-center">
            <Button
              variant="secondary"
              disabled={isLoadingMore}
              onClick={() => void fetchPage(activeFilter, false)}
            >
              <ChevronDown className="size-4" />
              {isLoadingMore ? "Cargando..." : "Cargar más"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
