import { Link } from "react-router-dom";
import { AppointmentCard, AppointmentsEmptyState } from "@/components/AppointmentCard";
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
      <section >
        <div className="flex justify-between gap-4 items-start mb-3">
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Proximo turno</p>
            <h3>{nextAppointment ? "Tu siguiente reserva" : "Todavia no tienes turnos"}</h3>
          </div>
          {isLoading ? <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">Actualizando...</span> : null}
        </div>

        {nextAppointment ? (
          <AppointmentCard appointment={nextAppointment} highlightAsPrimary />
        ) : (
          <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
            <p>No hay reservas proximas. Puedes crear una nueva en pocos pasos.</p>
            <Link to="/booking/select-local">
              <Button>Empezar reserva</Button>
            </Link>
          </div>
        )}
      </section>
      <header className="rounded-[28px] border border-white/12 bg-[radial-gradient(circle_at_0%_0%,rgba(0,240,104,0.18),transparent_42%),linear-gradient(180deg,rgba(20,20,20,0.98),rgba(11,11,11,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.34)] flex justify-between gap-6 items-end p-8 max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Inicio</p>
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
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df] flex flex-wrap gap-4 items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" onClick={() => refreshData()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      <section className="grid grid-cols-3 gap-4 max-lg:grid-cols-2">
        <StatCard title="Turnos completados" value={dashboardStats.completedAppointments} />
        <StatCard title="Gasto mensual" value={formatCurrency(dashboardStats.monthlySpending)} />
        <StatCard title="Turnos historicos" value={dashboardStats.totalAppointments} />
      </section>

      <section className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Link className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45" to="/booking/select-local">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Reserva</p>
          <h3>Seleccionar local</h3>
          <p>Explora peluquerias activas y elige donde reservar.</p>
        </Link>
        <Link className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45" to="/profile/payments">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Pagos</p>
          <h3>Historial de pagos</h3>
          <p>Consulta estados, referencias y montos abonados.</p>
        </Link>
      </section>
    </section>
  );
}