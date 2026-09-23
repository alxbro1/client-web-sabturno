"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/Button";
import { useAvailableDaysQuery } from "@/hooks/queries/useAvailableDaysQuery";
import { useTimeSlotsQuery } from "@/hooks/queries/useTimeSlotsQuery";
import { parseBookingQuery } from "@/lib/utils/bookingQuery";
import { cn } from "@/lib/utils";
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
      // TODO(W2): reemplazar por el empleado elegido en el store.
      undefined,
      availabilityRefreshToken,
    );

  const { data: timeSlots, isLoading: timeSlotsLoading, error: timeSlotsError } =
    useTimeSlotsQuery(
      local?.id,
      selectedDate,
      service?.duration ?? null,
      // TODO(W2): reemplazar por el empleado elegido en el store.
      undefined,
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
  const missingStepLabel = !selectedDate
    ? "Elegí una fecha para continuar."
    : "Elegí un horario para continuar.";

  // El estado seleccionado se marca con RELLENO, no con borde: un borde fino no
  // compite con el texto blanco de los chips sin seleccionar.
  const chipBase =
    "inline-flex min-h-11 w-full items-center justify-center rounded-full border px-3 text-sm transition-colors duration-150 outline-none cursor-pointer focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-35";
  const chipInactive =
    "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground";
  const chipActive =
    "border-primary bg-primary font-semibold text-primary-foreground";

  return (
    <section className="flex flex-col gap-6 py-6">
      <div>
        <Button
          variant="ghost"
          className="-ml-3 gap-1 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setService(null);
            router.push("/booking/select-service");
          }}
        >
          <ChevronLeft className="size-4" />
          Cambiar servicio
        </Button>
      </div>

      <header>
        <h2 className="text-2xl font-bold text-foreground">Fecha y horario</h2>
        <p className="text-muted-foreground">
          {service.name} en {local.name} por {formatCurrency(service.cost)}
        </p>
      </header>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-semibold text-foreground">Elegí el día</h3>
          {datesLoading ? (
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Cargando...
            </span>
          ) : null}
        </div>

        {datesError ? (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {datesError.message}
          </div>
        ) : null}

        {!datesLoading && !datesError && !availableDates?.length ? (
          <p className="text-muted-foreground">
            Este servicio no tiene días disponibles por ahora.
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {availableDates?.map((date) => {
            const value = formatDateOnlyLocal(date);
            const isActive =
              selectedDate !== null && formatDateOnlyLocal(selectedDate) === value;
            return (
              <button
                key={value}
                className={cn(chipBase, isActive ? chipActive : chipInactive)}
                onClick={() => handleDateSelect(date)}
                type="button"
                aria-pressed={isActive}
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

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-semibold text-foreground">Elegí el horario</h3>
          {timeSlotsLoading ? (
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Cargando...
            </span>
          ) : null}
        </div>

        {!selectedDate ? (
          <p className="text-muted-foreground">
            Primero elegí una fecha para ver los horarios libres.
          </p>
        ) : null}

        {timeSlotsError ? (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {timeSlotsError.message}
          </div>
        ) : null}

        {selectedDate && !timeSlotsLoading && !timeSlotsError && !timeSlots?.length ? (
          <p className="text-muted-foreground">
            No quedan horarios libres ese día. Probá con otra fecha.
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {timeSlots?.map((slot) => {
            const isActive = selectedTime === slot.time;
            return (
              <button
                key={slot.time}
                className={cn(chipBase, isActive ? chipActive : chipInactive)}
                onClick={() => handleTimeSelect(slot.time)}
                type="button"
                disabled={!slot.available}
                aria-pressed={isActive}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      </section>

      <div className="sticky bottom-0 -mx-4 mt-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        {!isFormValid ? (
          <p
            id="booking-continue-help"
            className="mb-2 text-center text-sm text-muted-foreground"
          >
            {missingStepLabel}
          </p>
        ) : null}
        <div className="flex justify-center">
          <Button
            disabled={!isFormValid}
            onClick={() => router.push("/booking/payment")}
            aria-describedby={!isFormValid ? "booking-continue-help" : undefined}
            className="w-full max-w-sm disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
          >
            Continuar
          </Button>
        </div>
      </div>
    </section>
  );
}
