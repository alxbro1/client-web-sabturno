"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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
  const service = useBookingStore((s) => s.service);
  const setLocal = useBookingStore((s) => s.setLocal);
  const setService = useBookingStore((s) => s.setService);
  const setLoyaltyCouponCode = useBookingStore((s) => s.setLoyaltyCouponCode);
  const hasHandledServiceDeepLinkRef = useRef(false);

  const { localId: localIdQuery, serviceId: serviceIdQuery, coupon } =
    parseBookingQuery(searchParams);

  const { locals, isLoading: isLoadingLocals } = useLocalsQuery();

  useEffect(() => {
    if (!localIdQuery || local?.id) return;

    const matchedLocal = locals.find((item) => String(item.id) === localIdQuery);
    if (matchedLocal) {
      setLocal(matchedLocal);
    }
  }, [localIdQuery, locals, local?.id, setLocal]);

  useEffect(() => {
    if (coupon) setLoyaltyCouponCode(coupon.toUpperCase());
  }, [coupon, setLoyaltyCouponCode]);

  const localId = local?.id ? String(local.id) : localIdQuery;

  const {
    data: services,
    isLoading: isLoadingServices,
    error,
  } = useServicesQuery(localId);

  function buildSelectProfessionalUrl(serviceId: number) {
    const query = buildBookingSearch({ localId, serviceId, coupon });
    return query
      ? `/booking/select-professional?${query}`
      : "/booking/select-professional";
  }

  useEffect(() => {
    if (
      !serviceIdQuery ||
      !services?.length ||
      hasHandledServiceDeepLinkRef.current ||
      service?.id // ya hay un servicio en el store (back navigation)
    ) {
      return;
    }

    const matchedService = services.find(
      (item) => Number(item.id) === serviceIdQuery,
    );

    if (matchedService) {
      hasHandledServiceDeepLinkRef.current = true;
      setService(matchedService);
      router.replace(buildSelectProfessionalUrl(matchedService.id));
    }
  }, [serviceIdQuery, services, router, setService, service?.id]);

  useEffect(() => {
    if (!localIdQuery && !local?.id) {
      router.replace("/booking/select-local");
    }
  }, [localIdQuery, local?.id, router]);

  function handleSelect(service: Service) {
    setService(service);
    router.push(buildSelectProfessionalUrl(service.id));
  }

  const isLoading = isLoadingLocals || isLoadingServices;

  return (
    <section className="flex flex-col items-start gap-6 py-6">
      <div>
        <Button
          variant="ghost"
          className="-ml-3 gap-1 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setLocal(null);
            router.push("/booking/select-local");
          }}
        >
          <ChevronLeft className="size-4" />
          Cambiar local
        </Button>
      </div>

      <header>
        <h2 className="text-2xl font-bold text-foreground">Elegí un servicio</h2>
        {local?.name && (
          <p className="text-muted-foreground">En {local.name}</p>
        )}
      </header>

      {isLoading ? (
        <div className="w-full rounded-xl border border-border bg-card p-5 min-h-[140px] grid place-items-center text-center text-muted-foreground">
          Cargando servicios...
        </div>
      ) : null}

      {error ? (
        <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </div>
      ) : null}

      {!isLoading && !error && services?.length === 0 ? (
        <div className="grid w-full place-items-center gap-2 rounded-xl border border-border bg-card p-8 text-center">
          <p className="font-semibold text-foreground">
            Este local todavía no publicó servicios
          </p>
          <p className="text-sm text-muted-foreground">
            Probá con otro local.
          </p>
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-4">
        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  );
}
