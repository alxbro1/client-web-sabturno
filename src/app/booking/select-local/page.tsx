"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { LocalCard } from "@/components/LocalCard";
import { useLocalsQuery } from "@/hooks/queries/useLocalsQuery";
import { buildBookingSearch, parseBookingQuery } from "@/lib/utils/bookingQuery";
import { useBookingStore } from "@/stores/booking";
import type { Local } from "@/lib/types/local";

export default function SelectLocalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locals, isLoading, error, isFetchingNextPage, hasMore, fetchNextPage, refetch } =
    useLocalsQuery();
  const setLocal = useBookingStore((s) => s.setLocal);
  const hasHandledDeepLinkRef = useRef(false);

  const { localId: localIdQuery, serviceId: serviceIdQuery } =
    parseBookingQuery(searchParams);

  function buildSelectServiceUrl(localId: string) {
    const query = buildBookingSearch({ localId, serviceId: serviceIdQuery });
    return query ? `/booking/select-service?${query}` : "/booking/select-service";
  }

  useEffect(() => {
    if (!localIdQuery || isLoading || hasHandledDeepLinkRef.current) {
      return;
    }

    const matchedLocal = locals.find((item) => String(item.id) === localIdQuery);
    if (!matchedLocal) {
      return;
    }

    hasHandledDeepLinkRef.current = true;
    setLocal(matchedLocal);
    router.replace(buildSelectServiceUrl(String(matchedLocal.id)));
  }, [isLoading, localIdQuery, locals, router, setLocal]);

  function handleSelect(local: Local) {
    setLocal(local);
    router.push(buildSelectServiceUrl(String(local.id)));
  }

  return (
    <section className="flex flex-col gap-6 p-6 min-h-screen items-start">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch w-full">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Reserva paso 1
          </p>
          <h2>Selecciona un local</h2>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Actualizar lista
        </Button>
      </header>

      {isLoading ? (
        <div className="w-full rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
          Cargando locales...
        </div>
      ) : null}

      {error ? (
        <div className="w-full rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 w-full">
        {locals.map((local) => (
          <LocalCard key={local.id} local={local} onSelect={handleSelect} />
        ))}
      </div>

      {hasMore ? (
        <div className="flex flex-wrap gap-3 justify-center items-center w-full">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Cargando..." : "Cargar mas locales"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
