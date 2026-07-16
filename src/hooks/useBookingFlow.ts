import { useEffect, useState } from "react";
import { DEFAULT_TIMEZONE } from "@/lib/constants/countries";
import { convertLocalToUTC, formatDateOnlyLocal, parseDateOnlyToLocal } from "@/lib/utils/date";
import { bookingService } from "@/services/booking";
import { useAuth } from "@/hooks/useAuth";
import { useBookingStore } from "@/stores/booking";
import { PaymentMethod, type BookingDTO, type TimeSlot } from "@/lib/types/booking";

export function useBookingFlow() {
  const {
    date: storedDate,
    time: storedTime,
    setDate,
    setTime,
    setPaymentMethod,
    paymentMethod,
    local,
    service,
    availabilityRefreshToken,
    resetBooking,
  } = useBookingStore();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    storedDate ? parseDateOnlyToLocal(storedDate) : null,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(storedTime);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [datesError, setDatesError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [timeSlotsError, setTimeSlotsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAvailableDays() {
      if (!local?.id || !service?.id) {
        setAvailableDates([]);
        return;
      }

      setDatesLoading(true);
      setDatesError(null);

      try {
        const days = await bookingService.getAvailableDays(local.id, service.id);
        if (isMounted) {
          setAvailableDates(days.map((day) => parseDateOnlyToLocal(day)));
        }
      } catch {
        if (isMounted) {
          setDatesError("Error al cargar fechas disponibles");
        }
      } finally {
        if (isMounted) {
          setDatesLoading(false);
        }
      }
    }

    loadAvailableDays().catch(console.error);
    return () => {
      isMounted = false;
    };
  }, [availabilityRefreshToken, local?.id, service?.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadTimeSlots() {
      if (!local?.id || !service?.duration || !selectedDate) {
        setTimeSlots([]);
        return;
      }

      setTimeSlotsLoading(true);
      setTimeSlotsError(null);

      try {
        const slots = await bookingService.getAvailableTimeSlots(
          local.id,
          formatDateOnlyLocal(selectedDate),
          service.duration,
        );
        if (isMounted) {
          setTimeSlots(slots);
        }
      } catch {
        if (isMounted) {
          setTimeSlotsError("Error al cargar horarios disponibles");
        }
      } finally {
        if (isMounted) {
          setTimeSlotsLoading(false);
        }
      }
    }

    loadTimeSlots().catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [availabilityRefreshToken, local?.id, selectedDate, service?.duration]);

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
    setDate(formatDateOnlyLocal(date));
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setTime(time);
  }

  async function bookAppointment(extra?: { email?: string; userName?: string, phoneNumber?: string }) {
    if (!selectedDate || !selectedTime || !service) {
      throw new Error("Faltan datos para reservar");
    }

    setIsLoading(true);

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const localDateTime = new Date(selectedDate);
      localDateTime.setHours(hours, minutes, 0, 0);

      const timezone = user?.timezone || local?.timezone || DEFAULT_TIMEZONE;
      const appointmentData: BookingDTO = {
        startDateTime: convertLocalToUTC(localDateTime, timezone),
        serviceId: service.id,
        countryCode: user?.countryCode || local?.countryCode,
        timezone,
        paymentMethod: paymentMethod || undefined,
        email: user?.email || extra?.email || "",
        userName: user?.name || extra?.userName,
        phoneNumber: user?.phone || extra?.phoneNumber,
      };
      if (user?.id) appointmentData.userId = user.id;

      const createdAppointment = await bookingService.createAppointment(appointmentData);
      resetBooking();
      return createdAppointment;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    selectedDate,
    selectedTime,
    availableDates,
    datesLoading,
    datesError,
    timeSlots,
    timeSlotsLoading,
    timeSlotsError,
    local,
    service,
    paymentMethod,
    setPaymentMethod,
    handleDateSelect,
    handleTimeSelect,
    bookAppointment,
    isLoading,
    isFormValid: Boolean(selectedDate && selectedTime),
    hasCheckoutMethods:
      Boolean(local?.mercadoPagoLiveMode) ||
      Boolean(local?.payWithCashInFront) ||
      Boolean(local?.payWithReservation) ||
      Boolean(local?.payWithTalo),
  };
}