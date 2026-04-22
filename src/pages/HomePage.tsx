import { Link } from "react-router-dom";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Button } from "@/components/Button";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/utils/date";
import { useUserHome } from "@/hooks/useUserHome";
import { useAuthStore } from "@/stores/auth";

export function HomePage() {
  const { user } = useAuthStore();
  const { nextAppointment, dashboardStats, isLoading, error, refreshData } = useUserHome();

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-6 items-end p-8 rounded-[28px] bg-[linear-gradient(135deg,rgba(249,115,22,0.18),rgba(34,211,238,0.08)),rgba(10,22,35,0.9)] max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="eyebrow">Inicio</p>
          <h2>Bienvenido, {user?.name || "cliente"}</h2>
          <p>Desde aca puedes reservar turnos, revisar pagos y editar tu perfil sin salir del navegador.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Link to="/booking/select-local">
            <Button>Reservar turno</Button>
          </Link>
          <Link to="/appointments">
            <Button variant="secondary">Mis turnos</Button>
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200 flex flex-wrap gap-4 items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" onClick={() => refreshData()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      <section className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <StatCard title="Turnos completados" value={dashboardStats.completedAppointments} />
        <StatCard title="Gasto mensual" value={formatCurrency(dashboardStats.monthlySpending)} />
        <StatCard title="Turnos historicos" value={dashboardStats.totalAppointments} />
      </section>

      <section className="surface grid gap-[1.1rem]">
        <div className="flex justify-between gap-4 items-start">
          <div>
            <p className="eyebrow">Proximo turno</p>
            <h3>{nextAppointment ? "Tu siguiente reserva" : "Todavia no tienes turnos"}</h3>
          </div>
          {isLoading ? <span className="meta-label">Actualizando...</span> : null}
        </div>

        {nextAppointment ? (
          <AppointmentCard appointment={nextAppointment} />
        ) : (
          <div className="min-h-[140px] grid place-items-center text-center text-[#aab8c9]">
            <p>No hay reservas proximas. Puedes crear una nueva en pocos pasos.</p>
            <Link to="/booking/select-local">
              <Button>Empezar reserva</Button>
            </Link>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Link className="surface transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-orange-500/45" to="/booking/select-local">
          <p className="eyebrow">Reserva</p>
          <h3>Seleccionar local</h3>
          <p>Explora peluquerias activas y elige donde reservar.</p>
        </Link>
        <Link className="surface transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-orange-500/45" to="/profile/payments">
          <p className="eyebrow">Pagos</p>
          <h3>Historial de pagos</h3>
          <p>Consulta estados, referencias y montos abonados.</p>
        </Link>
      </section>
    </section>
  );
}