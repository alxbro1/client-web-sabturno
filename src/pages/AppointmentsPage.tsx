import { useState } from "react";
import { Link } from "react-router-dom";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Button } from "@/components/Button";
import { useUserAppointments } from "@/hooks/useUserAppointments";

type FilterType = "upcoming" | "past";

export function AppointmentsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("upcoming");
  const {
    upcomingAppointments,
    pastAppointments,
    isLoading,
    error,
    loadingMore,
    hasMore,
    loadMore,
    handleRefresh,
    handleCancelAppointment,
  } = useUserAppointments(activeFilter);

  const appointments = activeFilter === "upcoming" ? upcomingAppointments : pastAppointments;

  async function handleCancel(appointmentId: number) {
    const shouldCancel = window.confirm("Esta accion cancelara el turno. Quieres continuar?");
    if (!shouldCancel) {
      return;
    }

    const success = await handleCancelAppointment(appointmentId);
    if (!success) {
      window.alert("No se pudo cancelar el turno.");
    }
  }

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="eyebrow">Turnos</p>
          <h2>Mis reservas</h2>
          <p>Gestiona citas proximas, historiales y cancelaciones.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Link to="/booking/select-local">
            <Button>Reservar nuevo turno</Button>
          </Link>
          <Button variant="secondary" onClick={() => handleRefresh()}>
            Actualizar
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <button className={`inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border text-sm cursor-pointer text-white ${activeFilter === "upcoming" ? "border-orange-500/65 bg-orange-500/15" : "border-white/[0.18] bg-transparent"}`} onClick={() => setActiveFilter("upcoming")}>
          Proximos ({upcomingAppointments.length})
        </button>
        <button className={`inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border text-sm cursor-pointer text-white ${activeFilter === "past" ? "border-orange-500/65 bg-orange-500/15" : "border-white/[0.18] bg-transparent"}`} onClick={() => setActiveFilter("past")}>
          Historial
        </button>
      </div>

      {isLoading ? <div className="surface min-h-[140px] grid place-items-center text-center text-[#aab8c9]">Cargando turnos...</div> : null}
      {error ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{error}</div> : null}

      <div className="grid gap-[0.85rem]">
        {!isLoading && appointments.length === 0 ? (
          <div className="surface min-h-[140px] grid place-items-center text-center text-[#aab8c9]">
            <p>{activeFilter === "upcoming" ? "No tienes turnos proximos." : "No tienes historial de turnos."}</p>
          </div>
        ) : null}
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            showCancel={activeFilter === "upcoming"}
            onCancel={handleCancel}
          />
        ))}
      </div>

      {hasMore ? (
        <div className="flex flex-wrap gap-3 justify-center items-center">
          <Button variant="secondary" onClick={() => loadMore()} disabled={loadingMore}>
            {loadingMore ? "Cargando..." : "Cargar mas"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}