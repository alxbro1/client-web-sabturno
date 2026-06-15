"use client";

import Link from "next/link";
import { LocalStatsCard } from "@/components/local/LocalStatsCard";
import { LocalNavCard } from "@/components/local/LocalNavCard";
import { useLocalHomeQuery } from "@/hooks/queries/useLocalHomeQuery";
import { useAuthStore } from "@/stores/auth";
import { formatCurrency } from "@/lib/utils/date";
import { Button } from "@/components/Button";

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V10h14v9zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-[#00f068]/15 text-[#00f068] border-[#00f068]/30",
  completed: "bg-white/5 text-white/50 border-white/10",
  cancelled: "bg-[#ff5678]/15 text-[#ff5678] border-[#ff5678]/30",
};

export default function LocalDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch } = useLocalHomeQuery();

  const nextAppointment = data?.nextAppointment ?? null;
  const todayAppointments = data?.todayAppointments ?? [];
  const dashboardStats = data?.dashboardStats ?? {
    todayAppointments: 0,
    weekAppointments: 0,
    monthlyRevenue: 0,
    totalClients: 0,
  };

  return (
    <section className="grid gap-6">
      <header className="rounded-[28px] border border-white/12 bg-[radial-gradient(circle_at_0%_0%,rgba(0,240,104,0.18),transparent_42%),linear-gradient(180deg,rgba(20,20,20,0.98),rgba(11,11,11,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.34)] flex justify-between gap-6 items-end p-8 max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068] mb-1">
            Panel del Local
          </p>
          <h2 className="text-2xl font-bold text-white">
            {user?.localName || user?.name}
          </h2>
          <p className="text-white/60 mt-1">
            Desde aqui puedes gestionar turnos, horarios y mas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Link href="/local/calendar">
            <Button variant="primary">Ver turnos</Button>
          </Link>
          <Button variant="secondary" onClick={() => refetch()}>
            Actualizar
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df] flex flex-wrap gap-4 items-center justify-between">
          <span>{error.message}</span>
          <Button variant="ghost" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      <section className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <LocalStatsCard
          title="Turnos hoy"
          value={dashboardStats.todayAppointments}
          icon={<IconCalendar />}
        >
          <span className="text-[0.75rem] text-white/40">
            {new Date().toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </LocalStatsCard>

        <LocalStatsCard
          title="Esta semana"
          value={dashboardStats.weekAppointments}
          icon={<IconClock />}
        />

        <LocalStatsCard
          title="Ingresos del mes"
          value={formatCurrency(dashboardStats.monthlyRevenue)}
          icon={<IconDollar />}
        />

        <LocalStatsCard
          title="Total clientes"
          value={dashboardStats.totalClients}
          icon={<IconUsers />}
        />
      </section>

      <section>
        <div className="flex justify-between gap-4 items-start mb-3">
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
              Proximo turno
            </p>
            <h3 className="text-lg font-semibold text-white">
              {nextAppointment
                ? "Siguiente reserva"
                : "Sin turnos proximos"}
            </h3>
          </div>
          {isLoading && (
            <span className="text-[0.78rem] uppercase tracking-[0.08em] text-white/52">
              Actualizando...
            </span>
          )}
        </div>

        {nextAppointment ? (
          <article className="border border-[#00f068]/25 bg-[linear-gradient(135deg,rgba(0,240,104,0.08),rgba(0,240,104,0.02))] rounded-[28px] p-6 shadow-[0_8px_32px_rgba(0,240,104,0.15)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[0.8rem] text-white/50 uppercase tracking-wider mb-1">
                  Cliente
                </p>
                <p className="text-xl font-bold text-white">
                  {nextAppointment.clientName}
                </p>
                <p className="text-[#00f068] mt-1">
                  {nextAppointment.serviceName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.8rem] text-white/50 uppercase tracking-wider mb-1">
                  Hora
                </p>
                <p className="text-lg font-bold text-white">
                  {formatTime(nextAppointment.startDateTime)}
                </p>
                <p className="text-white/60 text-sm">
                  {formatDateLong(nextAppointment.startDateTime)}
                </p>
              </div>
            </div>
          </article>
        ) : (
          <div className="min-h-[120px] grid place-items-center text-center text-white/50 rounded-[28px] border border-white/10 bg-white/[0.02] p-8">
            <p>No hay reservas proximas programadas.</p>
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between gap-4 items-start mb-3">
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
              Hoy
            </p>
            <h3 className="text-lg font-semibold text-white">
              Turnos del dia
            </h3>
          </div>
          <span className="text-[0.8rem] text-white/50">
            {todayAppointments.length} turno
            {todayAppointments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {todayAppointments.length > 0 ? (
          <div className="grid gap-3">
            {todayAppointments.slice(0, 8).map((appt) => (
              <article
                key={appt.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-1 h-10 rounded-full bg-[#00f068]/40" />
                  <div>
                    <p className="font-semibold text-white">
                      {appt.clientName}
                    </p>
                    <p className="text-sm text-white/60">{appt.serviceName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[appt.status] || statusColors.pending}`}
                  >
                    {appt.status === "pending"
                      ? "Pendiente"
                      : appt.status === "confirmed"
                        ? "Confirmado"
                        : appt.status === "completed"
                          ? "Completado"
                          : "Cancelado"}
                  </span>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatTime(appt.startDateTime)}
                    </p>
                    <p className="text-sm text-white/50">
                      {formatCurrency(appt.price)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {todayAppointments.length > 8 && (
              <Link
                href="/local/calendar"
                className="text-center py-3 text-[#00f068] text-sm hover:underline"
              >
                Ver todos los {todayAppointments.length} turnos
              </Link>
            )}
          </div>
        ) : (
          <div className="min-h-[80px] grid place-items-center text-center text-white/50 rounded-[28px] border border-white/10 bg-white/[0.02] p-6">
            <p>No hay turnos programados para hoy.</p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <LocalNavCard
          to="/local/calendar"
          title="Turnos"
          description="Ver y gestionar todos los turnos del local"
          icon={<IconCalendar />}
        />
        <LocalNavCard
          to="/local/schedules"
          title="Horarios"
          description="Configurar plantilla de horarios semanal"
          icon={<IconClock />}
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
        <LocalNavCard
          to="/local/images"
          title="Fotos"
          description="Gestionar fotos del local"
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          }
        />
      </section>
    </section>
  );
}
