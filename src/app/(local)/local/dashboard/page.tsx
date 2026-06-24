"use client";

import Link from "next/link";
import { CalendarDays, Clock, Users, DollarSign, Ban, Image as ImageIcon, Crown } from "lucide-react";
import { LocalStatsCard } from "@/components/local/LocalStatsCard";
import { LocalNavCard } from "@/components/local/LocalNavCard";
import { PlanBadge, TrialCountdown } from "@/components/premium";
import { useLocalHomeQuery } from "@/hooks/queries/useLocalHomeQuery";
import { usePremiumStatusQuery } from "@/hooks/queries/usePremiumStatusQuery";
import { useAuthStore } from "@/stores/auth";
import { formatCurrency } from "@/lib/utils/date";
import { Button } from "@/components/Button";

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
  confirmed: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function LocalDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch } = useLocalHomeQuery();
  const { data: premiumStatus } = usePremiumStatusQuery();

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
      <header className="bg-gradient-to-b from-primary/[0.06] to-transparent bg-card border border-border shadow-sm rounded-xl flex justify-between gap-6 items-end p-8 max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            Panel del Local
          </p>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-foreground">
              {user?.localName || user?.name}
            </h2>
            {premiumStatus && <PlanBadge tier={premiumStatus.tier} />}
          </div>
          {premiumStatus?.status === "trial" && premiumStatus.trialEndDate && (
            <TrialCountdown
              trialEndDate={premiumStatus.trialEndDate}
              className="mb-2"
            />
          )}
          <p className="text-muted-foreground mt-1">
            Desde aqui puedes gestionar turnos, horarios y mas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Link href="/local/calendar">
            <Button>Ver turnos</Button>
          </Link>
          <Button variant="secondary" onClick={() => refetch()}>
            Actualizar
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex flex-wrap gap-4 items-center justify-between">
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
          icon={<CalendarDays className="size-5" />}
        >
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </LocalStatsCard>

        <LocalStatsCard
          title="Esta semana"
          value={dashboardStats.weekAppointments}
          icon={<Clock className="size-5" />}
        />

        <LocalStatsCard
          title="Ingresos del mes"
          value={formatCurrency(dashboardStats.monthlyRevenue)}
          icon={<DollarSign className="size-5" />}
        />

        <LocalStatsCard
          title="Total clientes"
          value={dashboardStats.totalClients}
          icon={<Users className="size-5" />}
        />
      </section>

      <section>
        <div className="flex justify-between gap-4 items-start mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Proximo turno
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {nextAppointment
                ? "Siguiente reserva"
                : "Sin turnos proximos"}
            </h3>
          </div>
          {isLoading && (
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Actualizando...
            </span>
          )}
        </div>

        {nextAppointment ? (
          <article className="border border-primary/25 bg-primary/[0.04] rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Cliente
                </p>
                <p className="text-xl font-bold text-foreground">
                  {nextAppointment.clientName}
                </p>
                <p className="text-primary mt-1">
                  {nextAppointment.serviceName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Hora
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatTime(nextAppointment.startDateTime)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {formatDateLong(nextAppointment.startDateTime)}
                </p>
              </div>
            </div>
          </article>
        ) : (
          <div className="min-h-[120px] grid place-items-center text-center rounded-xl border border-border bg-card p-8">
            <p className="text-muted-foreground">No hay reservas proximas programadas.</p>
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between gap-4 items-start mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Hoy
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              Turnos del dia
            </h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {todayAppointments.length} turno
            {todayAppointments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {todayAppointments.length > 0 ? (
          <div className="grid gap-3">
            {todayAppointments.slice(0, 8).map((appt) => (
              <article
                key={appt.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-1 h-10 rounded-full bg-primary/40" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {appt.clientName}
                    </p>
                    <p className="text-sm text-muted-foreground">{appt.serviceName}</p>
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
                    <p className="font-semibold text-foreground">
                      {formatTime(appt.startDateTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(appt.price)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {todayAppointments.length > 8 && (
              <Link
                href="/local/calendar"
                className="text-center py-3 text-primary text-sm hover:underline"
              >
                Ver todos los {todayAppointments.length} turnos
              </Link>
            )}
          </div>
        ) : (
          <div className="min-h-[80px] grid place-items-center text-center rounded-xl border border-border bg-card p-6">
            <p className="text-muted-foreground">No hay turnos programados para hoy.</p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <LocalNavCard
          to="/local/calendar"
          title="Turnos"
          description="Ver y gestionar todos los turnos del local"
          icon={<CalendarDays className="size-5" />}
        />
        <LocalNavCard
          to="/local/schedules"
          title="Horarios"
          description="Configurar plantilla de horarios semanal"
          icon={<Clock className="size-5" />}
        />
        <LocalNavCard
          to="/local/blockings"
          title="Bloqueos"
          description="Bloquear dias y franjas horarias"
          icon={<Ban className="size-5" />}
        />
        <LocalNavCard
          to="/local/images"
          title="Fotos"
          description="Gestionar fotos del local"
          icon={<ImageIcon className="size-5" />}
        />
        <LocalNavCard
          to="/local/payment-methods"
          title="Metodos de cobro"
          description="Configura MercadoPago, Talo, reserva y efectivo"
          icon={<DollarSign className="size-5" />}
        />
        <LocalNavCard
          to="/local/premium"
          title="Planes"
          description="Gestiona tu suscripción y desbloquea features"
          icon={<Crown className="size-5" />}
        />
      </section>
    </section>
  );
}
