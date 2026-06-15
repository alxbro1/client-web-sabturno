"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { ServiceCard } from "@/components/ServiceCard";
import { useServicesQuery } from "@/hooks/queries/useServicesQuery";
import { useLocalsQuery } from "@/hooks/queries/useLocalsQuery";
import { buildBookingSearch, parseBookingQuery } from "@/lib/utils/bookingQuery";
import { useBookingStore } from "@/stores/booking";
import type { Service } from "@/lib/types/booking";

export default function SelectServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const local = useBookingStore((s) => s.local);
  const setLocal = useBookingStore((s) => s.setLocal);
  const setService = useBookingStore((s) => s.setService);
  const hasHandledServiceDeepLinkRef = useRef(false);

  const { localId: localIdQuery, serviceId: serviceIdQuery } =
    parseBookingQuery(searchParams);

  const { locals, isLoading: isLoadingLocals } = useLocalsQuery();

  useEffect(() => {
    if (!localIdQuery || local?.id) return;

    const matchedLocal = locals.find((item) => String(item.id) === localIdQuery);
    if (matchedLocal) {
      setLocal(matchedLocal);
    }
  }, [localIdQuery, locals, local?.id, setLocal]);

  const localId = local?.id ? String(local.id) : localIdQuery;

  const {
    data: services,
    isLoading: isLoadingServices,
    error,
  } = useServicesQuery(localId);

  function buildAppointmentUrl(serviceId: number) {
    const query = buildBookingSearch({ localId, serviceId });
    return query ? `/booking/appointment?${query}` : "/booking/appointment";
  }

  useEffect(() => {
    if (!serviceIdQuery || !services?.length || hasHandledServiceDeepLinkRef.current) {
      return;
    }

    const matchedService = services.find(
      (item) => Number(item.id) === serviceIdQuery,
    );

    if (matchedService) {
      hasHandledServiceDeepLinkRef.current = true;
      setService(matchedService);
      router.replace(buildAppointmentUrl(matchedService.id));
    }
  }, [serviceIdQuery, services, router, setService]);

  useEffect(() => {
    if (!localIdQuery && !local?.id) {
      router.replace("/booking/select-local");
    }
  }, [localIdQuery, local?.id, router]);

  function handleSelect(service: Service) {
    setService(service);
    router.push(buildAppointmentUrl(service.id));
  }

  const isLoading = isLoadingLocals || isLoadingServices;

  return (
    <section className="flex flex-col gap-6 p-6 min-h-screen items-start">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch w-full">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Reserva paso 2
          </p>
          <h2>Selecciona un servicio</h2>
          {local?.name && <p>Local elegido: {local.name}</p>}
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push("/booking/select-local")}
        >
          Cambiar local
        </Button>
      </header>

      {isLoading ? (
        <div className="w-full rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
          Cargando servicios...
        </div>
      ) : null}

      {error ? (
        <div className="w-full rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {error.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 w-full">
        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  );
}
