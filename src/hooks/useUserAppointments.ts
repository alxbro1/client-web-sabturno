import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { bookingService } from "@/services/booking";
import { userService } from "@/services/user";
import type { Appointment } from "@/lib/types/booking";

type AppointmentFilter = "upcoming" | "past";

type AppointmentListState = {
  items: Appointment[];
  nextCursor: string | null;
  hasMore: boolean;
};

const INITIAL_LIST_STATE: AppointmentListState = {
  items: [],
  nextCursor: null,
  hasMore: true,
};

const STATUS_FILTERS: Record<AppointmentFilter, ("PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED")[]> = {
  upcoming: ["PENDING", "CONFIRMED"],
  past: ["COMPLETED", "CANCELLED"],
};

function normalizeAppointments(items: any[], user: ReturnType<typeof useAuthStore.getState>["user"]): Appointment[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item.service && item.local)
    .map((item) => ({
      id: item.id,
      startDateTime: item.startDateTime,
      endDateTime: item.endDateTime,
      status: item.state?.toLowerCase() || item.status || "pending",
      service: {
        id: item.service.id,
        name: item.service.name,
        description: item.service.description,
        cost: item.service.cost,
        duration: item.service.duration,
        category: item.service.category,
        isActive: item.service.isActive ?? true,
        localId: item.service.localId,
      },
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          }
        : undefined,
      localId: item.local.id,
      local: item.local,
      price: item.service.cost,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      paymentMethodSelected: item.paymentMethodSelected,
    }));
}

export function useUserAppointments(activeFilter: AppointmentFilter = "upcoming", limit = 6) {
  const { user } = useAuthStore();
  const [upcomingState, setUpcomingState] = useState(INITIAL_LIST_STATE);
  const [pastState, setPastState] = useState(INITIAL_LIST_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef<Record<AppointmentFilter, string | null>>({ upcoming: null, past: null });

  const fetchAppointments = useCallback(
    async (reset = false, filter: AppointmentFilter = activeFilter) => {
      if (!user?.id) {
        setError("No se encontro informacion del usuario");
        setIsLoading(false);
        return;
      }

      try {
        if (reset) {
          setIsLoading(true);
        }

        setError(null);
        const cursor = reset ? undefined : cursorRef.current[filter] ?? undefined;
        const result = await userService.getUserAppointmentsPaginated(user.id, {
          cursor,
          statuses: STATUS_FILTERS[filter],
          limit,
        });

        cursorRef.current[filter] = result.nextCursor;
        const newItems = normalizeAppointments(result.items, user);

        const updater = (prev: AppointmentListState): AppointmentListState => ({
          items: reset ? newItems : [...prev.items, ...newItems],
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        });

        if (filter === "upcoming") {
          setUpcomingState(updater);
        } else {
          setPastState(updater);
        }
      } catch (caughtError) {
        console.error(caughtError);
        setError("Error al cargar los turnos");
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, limit, user],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    cursorRef.current[activeFilter] = null;
    if (activeFilter === "upcoming") {
      setUpcomingState(INITIAL_LIST_STATE);
    } else {
      setPastState(INITIAL_LIST_STATE);
    }
    await fetchAppointments(true, activeFilter);
    setRefreshing(false);
  }, [activeFilter, fetchAppointments]);

  const loadMore = useCallback(async () => {
    const currentState = activeFilter === "upcoming" ? upcomingState : pastState;
    if (loadingMore || !currentState.hasMore || isLoading || refreshing) {
      return;
    }

    setLoadingMore(true);
    await fetchAppointments(false, activeFilter);
  }, [activeFilter, fetchAppointments, isLoading, loadingMore, pastState, refreshing, upcomingState]);

  const handleCancelAppointment = useCallback(async (appointmentId: number) => {
    const success = await bookingService.cancelBooking(String(appointmentId));
    if (!success) {
      return false;
    }

    const appointment = [...upcomingState.items, ...pastState.items].find((item) => item.id === appointmentId);
    setUpcomingState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== appointmentId),
    }));

    if (appointment) {
      setPastState((prev) => ({
        ...prev,
        items: [{ ...appointment, status: "cancelled" }, ...prev.items.filter((item) => item.id !== appointmentId)],
      }));
    }

    return true;
  }, [pastState.items, upcomingState.items]);

  useEffect(() => {
    cursorRef.current[activeFilter] = null;
    fetchAppointments(true, activeFilter).catch(console.error);
  }, [activeFilter, fetchAppointments]);

  const upcomingAppointments = useMemo(
    () => [...upcomingState.items].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()),
    [upcomingState.items],
  );

  const pastAppointments = useMemo(
    () => [...pastState.items].sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()),
    [pastState.items],
  );

  const currentState = activeFilter === "upcoming" ? upcomingState : pastState;

  return {
    upcomingAppointments,
    pastAppointments,
    isLoading,
    error,
    refreshing,
    loadingMore,
    hasMore: currentState.hasMore,
    handleRefresh,
    handleCancelAppointment,
    loadMore,
  };
}