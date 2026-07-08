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
  const setService = useBookingStore((s) => s.setService);
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
    return "/booking/select-service";
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

  const chipBase =
    "inline-flex items-center justify-center px-4 py-2 rounded-full border-2 text-sm cursor-pointer transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed";
  const chipInactive = "border-border bg-muted/20 text-muted-foreground hover:border-primary/35 hover:text-foreground";
  const chipActive = "border-[#00f068] bg-[#00f068]/15 text-[#00f068] shadow-[0_0_12px_rgba(0,240,104,0.25)]";

  return (
    <section className="flex flex-col gap-6 p-8 min-h-screen items-start">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch w-full">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Reserva paso 3
          </p>
          <h2 className="text-2xl font-bold text-foreground">Fecha y horario</h2>
          <p className="text-muted-foreground">
            {service.name} en {local.name} por {formatCurrency(service.cost)}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setService(null);
            router.push("/booking/select-service");
          }}
        >
          Cambiar servicio
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-4 items-start max-lg:grid-cols-1 w-full">
        <section className="mt-4">
          <div className="flex justify-between gap-4 items-start mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Fechas
              </p>
              <h3 className="text-lg font-semibold text-foreground">Disponibilidad</h3>
            </div>
            {datesLoading ? (
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Cargando...
              </span>
            ) : null}
          </div>

          {datesError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-3">
              {datesError.message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {availableDates?.map((date) => {
              const value = formatDateOnlyLocal(date);
              const isActive = selectedDate && formatDateOnlyLocal(selectedDate) === value;
              return (
                <button
                  key={value}
                  className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
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
          <div className="flex justify-between gap-4 items-start mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Horarios
              </p>
              <h3 className="text-lg font-semibold text-foreground">Turnos libres</h3>
            </div>
            {timeSlotsLoading ? (
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Cargando...
              </span>
            ) : null}
          </div>

          {!selectedDate ? (
            <p className="text-muted-foreground">Selecciona una fecha para ver horarios.</p>
          ) : null}

          {timeSlotsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-3">
              {timeSlotsError.message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {timeSlots?.map((slot) => {
              const isActive = selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
                  onClick={() => handleTimeSelect(slot.time)}
                  type="button"
                  disabled={!slot.available}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <Button
        disabled={!isFormValid}
        onClick={() => router.push("/booking/payment")}
        className="mt-6 max-w-sm self-center bg-[#00f068] text-black hover:bg-[#00f068]/90 focus:ring-[#00f068]/50"
      >
        Continuar
      </Button>
    </section>
  );
}
