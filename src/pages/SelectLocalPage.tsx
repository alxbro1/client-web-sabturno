import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { useLocalSelection } from "@/hooks/useLocalSelection";
import { buildBookingSearch, parseBookingQuery } from "@/lib/utils/bookingQuery";
import { useBookingStore } from "@/stores/booking";
import type { Local } from "@/lib/types/local";

export function SelectLocalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { locales, loading, error, loadingMore, hasMore, onRefresh, onEndReached } = useLocalSelection();
  const { setLocal } = useBookingStore();
  const hasHandledDeepLinkRef = useRef(false);

  const { localId: localIdQuery, serviceId: serviceIdQuery } = parseBookingQuery(searchParams);

  function buildSelectServiceUrl(localId: string) {
    const query = buildBookingSearch({ localId, serviceId: serviceIdQuery });
    return query ? `/booking/select-service?${query}` : "/booking/select-service";
  }

  useEffect(() => {
    if (!localIdQuery || loading || hasHandledDeepLinkRef.current) {
      return;
    }

    const matchedLocal = locales.find((item) => String(item.id) === localIdQuery);
    if (!matchedLocal) {
      return;
    }

    hasHandledDeepLinkRef.current = true;
    setLocal(matchedLocal);
    navigate(buildSelectServiceUrl(String(matchedLocal.id)), { replace: true });
  }, [loading, localIdQuery, locales, navigate, setLocal]);

  function handleSelect(local: Local) {
    setLocal(local);
    navigate(buildSelectServiceUrl(String(local.id)));
  }

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="eyebrow">Reserva paso 1</p>
          <h2>Selecciona un local</h2>
          <p>Usamos el mismo listado paginado de la app movil para mostrar locales disponibles.</p>
        </div>
        <Button variant="secondary" onClick={() => onRefresh()}>
          Actualizar lista
        </Button>
      </header>

      {loading ? <div className="surface min-h-[140px] grid place-items-center text-center text-[#aab8c9]">Cargando locales...</div> : null}
      {error ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{error}</div> : null}

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        {locales.map((local) => (
          <article className="surface grid gap-4 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-orange-500/45" key={local.id}>
            <div className="grid gap-3">
              <div>
                <p className="eyebrow">{local.city}</p>
                <h3>{local.name}</h3>
              </div>
              <p>{local.address}</p>
              <div className="flex flex-wrap gap-3">
                {local.mercadoPagoLiveMode ? <span className="inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border border-white/[0.18] bg-slate-700/40 text-sm">Mercado Pago</span> : null}
                {local.payWithCashInFront ? <span className="inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border border-white/[0.18] bg-slate-700/40 text-sm">Efectivo</span> : null}
                {local.payWithReservation ? <span className="inline-flex items-center justify-center px-[0.8rem] py-[0.55rem] rounded-full border border-white/[0.18] bg-slate-700/40 text-sm">Reserva parcial</span> : null}
              </div>
            </div>
            <Button onClick={() => handleSelect(local)} fullWidth>
              Elegir local
            </Button>
          </article>
        ))}
      </div>

      {hasMore ? (
        <div className="flex flex-wrap gap-3 justify-center items-center">
          <Button variant="secondary" onClick={() => onEndReached()} disabled={loadingMore}>
            {loadingMore ? "Cargando..." : "Cargar mas locales"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}