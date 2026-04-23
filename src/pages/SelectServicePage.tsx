import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { formatCurrency } from "@/lib/utils/date";
import { buildBookingSearch, parseBookingQuery } from "@/lib/utils/bookingQuery";
import type { Service } from "@/lib/types/booking";
import { bookingService } from "@/services/booking";
import { localService } from "@/services/local";
import { useBookingStore } from "@/stores/booking";

export function SelectServicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { local, setLocal, setService } = useBookingStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResolvingLocal, setIsResolvingLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasHandledServiceDeepLinkRef = useRef(false);

  const { localId: localIdQuery, serviceId: serviceIdQuery } = useMemo(
    () => parseBookingQuery(searchParams),
    [searchParams],
  );

  function buildAppointmentUrl(serviceId: number) {
    const localId = local?.id ? String(local.id) : localIdQuery;
    const query = buildBookingSearch({ localId, serviceId });
    return query ? `/booking/appointment?${query}` : "/booking/appointment";
  }

  useEffect(() => {
    if (!localIdQuery) {
      return;
    }

    if (local?.id && String(local.id) === localIdQuery) {
      return;
    }

    let cancelled = false;

    async function resolveLocalByQuery() {
      try {
        setIsResolvingLocal(true);
        setError(null);

        let cursor: string | undefined;
        let foundLocal = null as typeof local;

        do {
          const page = await localService.getLocales({ cursor, limit: 50 });
          foundLocal = page.items.find((item) => String(item.id) === localIdQuery) || null;
          cursor = page.nextCursor || undefined;
        } while (!foundLocal && cursor);

        if (cancelled) {
          return;
        }

        if (!foundLocal) {
          setError("No encontramos el local indicado en el enlace.");
          return;
        }

        setLocal(foundLocal);
      } catch {
        if (!cancelled) {
          setError("No se pudo resolver el local desde el enlace.");
        }
      } finally {
        if (!cancelled) {
          setIsResolvingLocal(false);
        }
      }
    }

    resolveLocalByQuery().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [local?.id, localIdQuery, setLocal]);

  useEffect(() => {
    if (isResolvingLocal) {
      return;
    }

    if (!local?.id) {
      if (localIdQuery) {
        return;
      }
      navigate("/booking/select-local", { replace: true });
      return;
    }

    const localId = local.id;

    async function loadServices() {
      try {
        setLoading(true);
        setError(null);
        setServices(await bookingService.getServicesByLocal(localId));
      } catch {
        setError("No se pudieron cargar los servicios");
      } finally {
        setLoading(false);
      }
    }

    loadServices().catch(console.error);
  }, [isResolvingLocal, local?.id, localIdQuery, navigate]);

  useEffect(() => {
    if (!serviceIdQuery || services.length === 0 || hasHandledServiceDeepLinkRef.current) {
      return;
    }

    hasHandledServiceDeepLinkRef.current = true;
    const matchedService = services.find((item) => Number(item.id) === serviceIdQuery);

    if (!matchedService) {
      setError("No encontramos el servicio indicado para este local.");
      return;
    }

    setService(matchedService);
    navigate(buildAppointmentUrl(matchedService.id), { replace: true });
  }, [local?.id, localIdQuery, navigate, serviceIdQuery, services, setService]);

  function handleSelect(service: Service) {
    setService(service);
    navigate(buildAppointmentUrl(service.id));
  }

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="eyebrow">Reserva paso 2</p>
          <h2>Selecciona un servicio</h2>
          <p>Local elegido: {local?.name}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/booking/select-local")}>Cambiar local</Button>
      </header>

      {loading ? <div className="surface min-h-[140px] grid place-items-center text-center text-[#aab8c9]">Cargando servicios...</div> : null}
      {error ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{error}</div> : null}

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        {services.map((service) => (
          <article key={service.id} className="surface grid gap-4 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-orange-500/45">
            <div className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-start">
              <div>
                <p className="eyebrow">{service.category}</p>
                <h3>{service.name}</h3>
              </div>
              <strong>{formatCurrency(service.cost)}</strong>
            </div>
            <p>{service.description || "Sin descripcion disponible."}</p>
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <span className="meta-label">{service.duration} min</span>
              <Button onClick={() => handleSelect(service)}>Elegir servicio</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}