"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { useAvailableDaysQuery } from "@/hooks/queries/useAvailableDaysQuery";
import { useTimeSlotsQuery } from "@/hooks/queries/useTimeSlotsQuery";
import { buildBookingSearch, parseBookingQuery } from "@/lib/utils/bookingQuery";
import { formatCurrency, formatDateOnlyLocal } from "@/lib/utils/date";
import { useBookingStore } from "@/stores/booking";

export default function SelectSlotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const local = useBookingStore((s) => s.local);
  const service = useBookingStore((s) => s.service);
  const setDate = useBookingStore((s) => s.setDate);
  const setTime = useBookingStore((s) => s.setTime);
  const availabilityRefreshToken = useBookingStore(
    (s) => s.availabilityRefreshToken,
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { localId: localIdQuery, serviceId: serviceIdQuery } =
    parseBookingQuery(searchParams);

  const { data: availableDates, isLoading: datesLoading, error: datesError } =
    useAvailableDaysQuery(
      local?.id,
      service?.id ?? null,
      availabilityRefreshToken,
    );

  const { data: timeSlots, isLoading: timeSlotsLoading, error: timeSlotsError } =
    useTimeSlotsQuery(
      local?.id,
      selectedDate,
      service?.duration ?? null,
      availabilityRefreshToken,
    );

  function buildSelectServiceUrl() {
    const localId = local?.id ? String(local.id) : localIdQuery;
    const query = buildBookingSearch({
      localId,
      serviceId: service?.id ?? serviceIdQuery,
    });
    return query ? `/booking/select-service?${query}` : "/booking/select-service";
  }

  if (!local || !service) {
    if (localIdQuery || serviceIdQuery) {
      router.replace(buildSelectServiceUrl());
    } else {
      router.replace("/booking/select-local");
    }
    return null;
  }

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
    setDate(formatDateOnlyLocal(date));
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setTime(time);
  }

  const isFormValid = selectedDate !== null && selectedTime !== null;

  return (
    <section className="flex flex-col gap-6 p-8 min-h-screen items-start">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch w-full">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Reserva paso 3
          </p>
          <h2>Fecha y horario</h2>
          <p>
            {service.name} en {local.name} por {formatCurrency(service.cost)}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push(buildSelectServiceUrl())}
        >
          Cambiar servicio
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-4 items-start max-lg:grid-cols-1 w-full">
        <section className="mt-4">
          <div className="flex justify-between gap-4 items-start mb-2">
            <div>
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
                Fechas
              </p>
              <h3>Disponibilidad</h3>
            </div>
            {datesLoading ? (
              <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">
                Cargando...
              </span>
            ) : null}
          </div>

          {datesError ? (
            <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
              {datesError.message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {availableDates?.map((date) => {
              const value = formatDateOnlyLocal(date);
              return (
                <button
                  key={value}
                  className={`inline-flex items-center justify-center px-[0.95rem] py-[0.58rem] rounded-full border text-[0.9rem] cursor-pointer text-white/88 bg-white/[0.02] transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-[#00f068]/35 ${
                    selectedDate && formatDateOnlyLocal(selectedDate) === value
                      ? "border-[#00f068]/56 bg-[#00f068]/16"
                      : "border-white/[0.18]"
                  }`}
                  onClick={() => handleDateSelect(date)}
                  type="button"
                >
                  {date.toLocaleDateString("es-AR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4">
          <div className="flex justify-between gap-4 items-start mb-2">
            <div>
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
                Horarios
              </p>
              <h3>Turnos libres</h3>
            </div>
            {timeSlotsLoading ? (
              <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">
                Cargando...
              </span>
            ) : null}
          </div>

          {!selectedDate ? (
            <p>Selecciona una fecha para ver horarios.</p>
          ) : null}

          {timeSlotsError ? (
            <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
              {timeSlotsError.message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {timeSlots?.map((slot) => (
              <button
                key={slot.time}
                className={`inline-flex items-center justify-center px-[0.95rem] py-[0.58rem] rounded-full border text-[0.9rem] cursor-pointer text-white/88 bg-white/[0.02] transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-[#00f068]/35 disabled:opacity-35 disabled:cursor-not-allowed ${
                  selectedTime === slot.time
                    ? "border-[#00f068]/56 bg-[#00f068]/16"
                    : "border-white/[0.18]"
                }`}
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

      <Button
        disabled={!isFormValid}
        onClick={() => router.push("/booking/payment")}
      >
        Continuar
      </Button>
    </section>
  );
}
