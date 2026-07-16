"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useLocalServicesQuery } from "@/hooks/queries/useLocalServicesQuery";
import { useAuth } from "@/hooks/useAuth";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const localId = user?.id ?? "";
  const { services, isLoading, error, deleteService } =
    useLocalServicesQuery(localId);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (deleteId === null) return;
    setIsDeleting(true);
    try {
      await deleteService(deleteId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.5rem] font-bold">Servicios</h1>
          <p className="text-white/54 text-[0.9rem]">
            Gestiona los servicios de tu local
          </p>
        </div>
        <Link href="/local/services/edit/new">
          <Button>Nuevo servicio</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
          Cargando servicios...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {error}
        </div>
      ) : services.length === 0 ? (
        <div className="min-h-[200px] grid place-items-center text-center">
          <div className="grid gap-4">
            <Wrench className="w-12 h-12 mx-auto text-white/24" />
            <p className="text-white/48">No hay servicios registrados</p>
            <Link href="/local/services/edit/new">
              <Button variant="secondary">Agregar primer servicio</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map((service) => (
            <article
              key={service.id}
              className="flex items-center gap-4 p-4 rounded-[18px] border border-white/10 bg-white/[0.02] transition-[background-color,border-color] duration-150 hover:bg-white/[0.04] hover:border-white/16"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium truncate">{service.name}</p>
                  {!service.isActive && (
                    <span className="text-[0.72rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/8 text-white/40">
                      Inactivo
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-[0.82rem] text-white/48 truncate mb-1">
                    {service.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.82rem] text-white/54">
                  <span>{formatCurrency(service.cost)}</span>
                  <span>{formatDuration(service.duration)}</span>
                  {service.category && <span>{service.category}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/local/services/edit/${service.id}`}>
                  <Button variant="secondary" className="px-3 py-2 text-[0.85rem]">
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  className="px-3 py-2 text-[0.85rem]"
                  onClick={() => setDeleteId(service.id)}
                >
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Eliminar servicio"
        description="Si el servicio tiene turnos asociados, sera desactivado en lugar de eliminado. De lo contrario, se eliminara permanentemente."
        confirmLabel="Eliminar"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
