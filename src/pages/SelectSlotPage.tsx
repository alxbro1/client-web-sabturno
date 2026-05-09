import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { buildBookingSearch, parseBookingQuery } from "@/lib/utils/bookingQuery";
import { formatCurrency, formatDateOnlyLocal } from "@/lib/utils/date";

export function SelectSlotPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    local,
    service,
    availableDates,
    datesLoading,
    datesError,
    timeSlots,
    timeSlotsLoading,
    timeSlotsError,
    selectedDate,
    selectedTime,
    handleDateSelect,
    handleTimeSelect,
    isFormValid,
  } = useBookingFlow();

  const { localId: localIdQuery, serviceId: serviceIdQuery } = parseBookingQuery(searchParams);

  function buildSelectServiceUrl() {
    const localId = local?.id ? String(local.id) : localIdQuery;
    const query = buildBookingSearch({
      localId,
      serviceId: service?.id ?? serviceIdQuery,
    });
    return query ? `/booking/select-service?${query}` : "/booking/select-service";
  }

  useEffect(() => {
    if (!local) {
      if (localIdQuery || serviceIdQuery) {
        navigate(buildSelectServiceUrl(), { replace: true });
      } else {
        navigate("/booking/select-local", { replace: true });
      }
      return;
    }

    if (!service) {
      navigate(buildSelectServiceUrl(), { replace: true });
    }
  }, [local, localIdQuery, navigate, service, serviceIdQuery]);

  if (!local || !service) {
    return null;
  }

  return (
    <section className="grid gap-6 p-6 h-full">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Reserva paso 3</p>
          <h2>Fecha y horario</h2>
          <p>
            {service.name} en {local.name} por {formatCurrency(service.cost)}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(buildSelectServiceUrl())}>Cambiar servicio</Button>
      </header>

      <div className="grid grid-cols-2 gap-4 items-start max-lg:grid-cols-1">
        <section className="mt-4">
          <div className="flex justify-between gap-4 items-start mb-2">
            <div>
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Fechas</p>
              <h3>Disponibilidad</h3>
            </div>
            {datesLoading ? <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">Cargando...</span> : null}
          </div>
          {datesError ? <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">{datesError}</div> : null}
          <div className="flex flex-wrap gap-3">
            {availableDates.map((date) => {
              const value = formatDateOnlyLocal(date);
              return (
                <button
                  key={value}
                  className={`inline-flex items-center justify-center px-[0.95rem] py-[0.58rem] rounded-full border text-[0.9rem] cursor-pointer text-white/88 bg-white/[0.02] transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-[#00f068]/35 ${selectedDate && formatDateOnlyLocal(selectedDate) === value ? "border-[#00f068]/56 bg-[#00f068]/16" : "border-white/[0.18]"}`}
                  onClick={() => handleDateSelect(date)}
                  type="button"
                >
                  {date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" })}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4">
          <div className="flex justify-between gap-4 items-start mb-2">
            <div>
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Horarios</p>
              <h3>Turnos libres</h3>
            </div>
            {timeSlotsLoading ? <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">Cargando...</span> : null}
          </div>
          {!selectedDate ? <p>Selecciona una fecha para ver horarios.</p> : null}
          {timeSlotsError ? <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">{timeSlotsError}</div> : null}
          <div className="flex flex-wrap gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                className={`inline-flex items-center justify-center px-[0.95rem] py-[0.58rem] rounded-full border text-[0.9rem] cursor-pointer text-white/88 bg-white/[0.02] transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-[#00f068]/35 disabled:opacity-35 disabled:cursor-not-allowed ${selectedTime === slot.time ? "border-[#00f068]/56 bg-[#00f068]/16" : "border-white/[0.18]"}`}
                onClick={() => handleTimeSelect(slot.time)}
                type="button"
                disabled={!slot.available}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </section>
      </div>

        <Button disabled={!isFormValid} onClick={() => navigate("/booking/payment")}>Continuar a pago</Button>
    </section>
  );
}