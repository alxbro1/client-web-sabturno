"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
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

  const { localId: localIdQuery, serviceId: serviceIdQuery, coupon } =
    parseBookingQuery(searchParams);

  function buildSelectServiceUrl(localId: string) {
    const query = buildBookingSearch({ localId, serviceId: serviceIdQuery, coupon });
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
    <section className="flex flex-col items-start gap-6 py-6">
      <header className="flex w-full items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Elegí un local</h2>
          <p className="text-muted-foreground">
            Empezá por el lugar donde querés atenderte.
          </p>
        </div>
        <Button
          variant="ghost"
          className="shrink-0 gap-1 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => refetch()}
        >
          <RefreshCw className="size-4" />
          Actualizar
        </Button>
      </header>

      {isLoading ? (
        <div className="w-full rounded-xl border border-border bg-card p-5 min-h-[140px] grid place-items-center text-center text-muted-foreground">
          Cargando locales...
        </div>
      ) : null}

      {error ? (
        <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && locals.length === 0 ? (
        <div className="grid w-full place-items-center gap-2 rounded-xl border border-border bg-card p-8 text-center">
          <p className="font-semibold text-foreground">
            Todavía no hay locales disponibles
          </p>
          <p className="text-sm text-muted-foreground">
            Volvé a intentar en unos minutos o actualizá la lista.
          </p>
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-4">
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
            {isFetchingNextPage ? "Cargando..." : "Cargar más locales"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
