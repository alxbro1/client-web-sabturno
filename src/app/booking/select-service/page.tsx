"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/Button";
import { ServiceCard } from "@/components/ServiceCard";
import { LocalHeroCarousel } from "@/components/booking/local-profile/LocalHeroCarousel";
import { LocalContactActions } from "@/components/booking/local-profile/LocalContactActions";
import { LocalInfoCard } from "@/components/booking/local-profile/LocalInfoCard";
import { ServiceCategoryTabs } from "@/components/booking/local-profile/ServiceCategoryTabs";
import { useServicesQuery } from "@/hooks/queries/useServicesQuery";
import { useLocalsQuery } from "@/hooks/queries/useLocalsQuery";
import { usePublicLocalImagesQuery } from "@/hooks/queries/usePublicLocalImagesQuery";
import { buildBookingSearch, parseBookingQuery } from "@/lib/utils/bookingQuery";
import { useBookingStore } from "@/stores/booking";
import {
  buildWhatsappUrl,
  buildTelUrl,
  buildMapsUrl,
  buildInstagramUrl,
} from "@/lib/utils/localLinks";
import {
  getLocalSchedule,
  getOpenStatus,
  formatScheduleSummary,
} from "@/lib/utils/localSchedule";
import type { Service } from "@/lib/types/booking";

const DEFAULT_CATEGORY = "Otros";

function serviceCategory(service: Service): string {
  return service.category?.trim() || DEFAULT_CATEGORY;
}

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

  const { data: images } = usePublicLocalImagesQuery(localId);

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

  const galleryImages = useMemo(
    () => (images ?? []).filter((img) => img.type === "GALLERY_IMAGE").map((img) => img.url),
    [images],
  );
  const coverImageUrl = useMemo(
    () => images?.find((img) => img.type === "COVER_IMAGE")?.url ?? null,
    [images],
  );
  const logoImageUrl = useMemo(
    () => images?.find((img) => img.type === "LOGO")?.url ?? null,
    [images],
  );

  const schedule = useMemo(
    () => getLocalSchedule(local?.timeStockTemplates),
    [local?.timeStockTemplates],
  );
  const openStatus = useMemo(
    () => getOpenStatus(local?.timeStockTemplates, new Date(), local?.timezone),
    [local?.timeStockTemplates, local?.timezone],
  );
  const scheduleSummary = useMemo(() => formatScheduleSummary(schedule), [schedule]);

  const whatsappUrl = useMemo(
    () => buildWhatsappUrl(local?.phone, local?.countryCode),
    [local?.phone, local?.countryCode],
  );
  const telUrl = useMemo(() => buildTelUrl(local?.phone), [local?.phone]);
  const instagramUrl = useMemo(
    () => buildInstagramUrl(local?.instagram),
    [local?.instagram],
  );
  const mapsUrl = useMemo(
    () => buildMapsUrl(local?.address, local?.city, local?.province),
    [local?.address, local?.city, local?.province],
  );

  const paymentChips = useMemo(() => {
    if (!local) return [];
    const chips: string[] = [];
    if (local.mercadoPagoLiveMode) chips.push("Mercado Pago");
    if (local.payWithCashInFront) chips.push("Efectivo");
    const reservationPct = Number(local.reservationPercentage || 0);
    if (local.payWithReservation && reservationPct >= 10 && reservationPct <= 60) {
      chips.push(`Seña ${reservationPct}%`);
    }
    if (local.payWithTalo) chips.push("Talo");
    return chips;
  }, [local]);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const svc of services ?? []) {
      const category = serviceCategory(svc);
      if (!seen.includes(category)) seen.push(category);
    }
    return seen;
  }, [services]);

  const [activeCategory, setActiveCategory] = useState("");
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const visibleServices = useMemo(() => {
    if (categories.length <= 1) return services ?? [];
    return (services ?? []).filter((svc) => serviceCategory(svc) === activeCategory);
  }, [services, categories, activeCategory]);

  return (
    <section className="flex flex-col gap-6 pb-6">
      <div className="pt-2">
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

      {local && (
        <>
          <LocalHeroCarousel
            galleryImages={galleryImages}
            coverImageUrl={coverImageUrl}
            logoUrl={logoImageUrl ?? local.imageProfile ?? null}
            localName={local.name}
            city={local.city}
            province={local.province}
          />

          <LocalContactActions
            whatsappUrl={whatsappUrl}
            telUrl={telUrl}
            instagramUrl={instagramUrl}
            mapsUrl={mapsUrl}
          />

          <LocalInfoCard
            isOpen={openStatus?.isOpen ?? null}
            scheduleSummary={scheduleSummary}
            address={[local.address, local.city].filter(Boolean).join(", ")}
            paymentChips={paymentChips}
          />
        </>
      )}

      <header>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Elegí un servicio
        </h2>
        <p className="text-sm text-muted-foreground">
          Tocá uno para elegir profesional y horario.
        </p>
      </header>

      <ServiceCategoryTabs
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

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
        {visibleServices.map((svc) => (
          <ServiceCard key={svc.id} service={svc} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  );
}
