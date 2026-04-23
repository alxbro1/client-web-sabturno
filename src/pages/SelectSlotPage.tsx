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
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="eyebrow">Reserva paso 3</p>
          <h2>Fecha y horario</h2>
          <p>
            {service.name} en {local.name} por {formatCurrency(service.cost)}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(buildSelectServiceUrl())}>Cambiar servicio</Button>
      </header>

      <div className="grid grid-cols-2 gap-4 items-start max-lg:grid-cols-1">
        <section className="surface grid gap-[0.85rem]">
          <div className="flex justify-between gap-4 items-start">
            <div>
              <p className="eyebrow">Fechas</p>
              <h3>Disponibilidad</h3>
            </div>
            {datesLoading ? <span className="meta-label">Cargando...</span> : null}
          </div>
          {datesError ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{datesError}</div> : null}
          <div className="flex flex-wrap gap-3">
            {availableDates.map((date) => {
              const value = formatDateOnlyLocal(date);
              return (
                <button
                  key={value}
                  className={`inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border text-sm cursor-pointer text-white ${selectedDate && formatDateOnlyLocal(selectedDate) === value ? "border-orange-500/65 bg-orange-500/15" : "border-white/[0.18] bg-transparent"}`}
                  onClick={() => handleDateSelect(date)}
                  type="button"
                >
                  {date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" })}
                </button>
              );
            })}
          </div>
        </section>

        <section className="surface grid gap-[0.85rem]">
          <div className="flex justify-between gap-4 items-start">
            <div>
              <p className="eyebrow">Horarios</p>
              <h3>Turnos libres</h3>
            </div>
            {timeSlotsLoading ? <span className="meta-label">Cargando...</span> : null}
          </div>
          {!selectedDate ? <p>Selecciona una fecha para ver horarios.</p> : null}
          {timeSlotsError ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{timeSlotsError}</div> : null}
          <div className="flex flex-wrap gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                className={`inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border text-sm cursor-pointer text-white disabled:opacity-35 disabled:cursor-not-allowed ${selectedTime === slot.time ? "border-orange-500/65 bg-orange-500/15" : "border-white/[0.18] bg-transparent"}`}
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

      <section className="surface grid gap-4">
        <div>
          <p className="eyebrow">Resumen</p>
          <h3>{service.name}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <div>
            <span className="meta-label">Local</span>
            <strong>{local.name}</strong>
          </div>
          <div>
            <span className="meta-label">Duracion</span>
            <strong>{service.duration} min</strong>
          </div>
          <div>
            <span className="meta-label">Fecha</span>
            <strong>{selectedDate ? selectedDate.toLocaleDateString("es-AR") : "Sin definir"}</strong>
          </div>
          <div>
            <span className="meta-label">Hora</span>
            <strong>{selectedTime || "Sin definir"}</strong>
          </div>
        </div>
        <Button disabled={!isFormValid} onClick={() => navigate("/booking/payment")}>Continuar a pago</Button>
      </section>
    </section>
  );
}