import { useState } from "react";
import { Link } from "react-router-dom";
import { AppointmentCard, AppointmentsEmptyState } from "@/components/AppointmentCard";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useUserAppointments } from "@/hooks/useUserAppointments";

type FilterType = "upcoming" | "past";

export function AppointmentsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("upcoming");
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
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

  function handleCancel(appointmentId: number) {
    setCancelingId(appointmentId);
  }

  async function handleConfirmCancel() {
    if (!cancelingId) return;

    setIsConfirming(true);
    try {
      const success = await handleCancelAppointment(cancelingId);
      if (!success) {
        setCancelError("No se pudo cancelar el turno.");
      } else {
        setCancelingId(null);
      }
    } catch (err) {
      setCancelError("Error inesperado al cancelar el turno.");
    } finally {
      setIsConfirming(false);
    }
  }

  function handleCancelDialog() {
    setCancelingId(null);
    setCancelError(null);
  }

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Turnos</p>
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
        <button className={`inline-flex items-center justify-center px-[0.95rem] py-[0.58rem] rounded-full border text-[0.9rem] cursor-pointer text-white/88 bg-white/[0.02] transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-[#00f068]/35 ${activeFilter === "upcoming" ? "border-[#00f068]/56 bg-[#00f068]/16" : "border-white/[0.18]"}`} onClick={() => setActiveFilter("upcoming")}>
          Proximos ({upcomingAppointments.length})
        </button>
        <button className={`inline-flex items-center justify-center px-[0.95rem] py-[0.58rem] rounded-full border text-[0.9rem] cursor-pointer text-white/88 bg-white/[0.02] transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-[#00f068]/35 ${activeFilter === "past" ? "border-[#00f068]/56 bg-[#00f068]/16" : "border-white/[0.18]"}`} onClick={() => setActiveFilter("past")}>
          Historial
        </button>
      </div>

      {isLoading ? <div className="border border-white/10 bg-[#12141a] rounded-2xl p-5 min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">Cargando turnos...</div> : null}
      {error ? <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">{error}</div> : null}

      <div className="grid gap-[0.85rem] [contain:layout_style]">
        {!isLoading && appointments.length === 0 ? (
          <AppointmentsEmptyState
            title={activeFilter === "upcoming" ? "No tienes turnos reservados" : "Todavia no tienes historial"}
            description={
              activeFilter === "upcoming"
                ? "Cuando reserves un nuevo turno, lo vas a ver aca con fecha, precio y datos del local."
                : "Todavia no registras turnos completados o anteriores en tu cuenta."
            }
            ctaLabel="Reservar nuevo turno"
          />
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

      <ConfirmDialog
        isOpen={cancelingId !== null}
        title="Cancelar turno"
        description={cancelError || "Esta acción cancelará el turno. ¿Estás seguro de que deseas continuar?"}
        confirmLabel="Cancelar turno"
        cancelLabel="No, mantener turno"
        isDangerous={true}
        isLoading={isConfirming}
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelDialog}
      />
    </section>
  );
}