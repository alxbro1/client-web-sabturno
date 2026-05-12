import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { ServiceCard } from "@/components/ServiceCard";
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
        let services = await bookingService.getServicesByLocal(localId);
        if (services.length > 0) {
          services = services.filter((service) => service.isActive);
        }
        setServices(services);
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
    <section className="flex flex-col gap-6 p-6 h-[100dvh] items-start">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch w-full">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Reserva paso 2</p>
          <h2>Selecciona un servicio</h2>
          <p>Local elegido: {local?.name}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/booking/select-local")}>Cambiar local</Button>
      </header>

      {loading ? <div className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">Cargando servicios...</div> : null}
      {error ? <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">{error}</div> : null}

      <div className="flex flex-col gap-4 w-full">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  );
}