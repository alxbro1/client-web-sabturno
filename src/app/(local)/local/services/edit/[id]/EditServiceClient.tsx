"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button";
import { InputField, TextareaField } from "@/components/Field";
import { useLocalServicesQuery } from "@/hooks/queries/useLocalServicesQuery";
import { useAuth } from "@/hooks/useAuth";
import type { LocalService } from "@/lib/types/service";

const CATEGORIES = [
  "Peluqueria",
  "Barberia",
  "Estetica",
  "Masajes",
  "Uñas",
  "Depilacion",
  "Cejas y pestanas",
  "Maquillaje",
  "Otros",
];

export default function ServiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const localId = user?.id ?? "";
  const isNew = id === "new";

  const {
    services,
    isLoading: isLoadingServices,
    createService,
    updateService,
  } = useLocalServicesQuery(localId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameErrors, setNameErrors] = useState<string[]>([]);
  const [costErrors, setCostErrors] = useState<string[]>([]);
  const [durationErrors, setDurationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isNew && services.length > 0) {
      const service = services.find((s) => s.id === Number(id));
      if (service) {
        setName(service.name);
        setDescription(service.description || "");
        setCost(String(service.cost));
        setDuration(String(service.duration));
        setCategory(service.category || "");
      }
    }
  }, [isNew, id, services]);

  function validateName(value: string): string[] {
    const errors: string[] = [];
    if (value.trim().length === 0) {
      errors.push("El nombre es requerido");
    }
    return errors;
  }

  function validateCost(value: string): string[] {
    const errors: string[] = [];
    const num = Number(value);
    if (value.trim().length === 0) {
      errors.push("El precio es requerido");
    } else if (isNaN(num) || num <= 0) {
      errors.push("El precio debe ser mayor a 0");
    }
    return errors;
  }

  function validateDuration(value: string): string[] {
    const errors: string[] = [];
    const num = Number(value);
    if (value.trim().length === 0) {
      errors.push("La duracion es requerida");
    } else if (isNaN(num) || num < 1) {
      errors.push("La duracion debe ser al menos 1 minuto");
    }
    return errors;
  }

  function handleNameChange(value: string) {
    setName(value);
    setNameErrors(validateName(value));
  }

  function handleCostChange(value: string) {
    setCost(value);
    setCostErrors(validateCost(value));
  }

  function handleDurationChange(value: string) {
    setDuration(value);
    setDurationErrors(validateDuration(value));
  }

  const isFormValid =
    name.trim().length > 0 &&
    nameErrors.length === 0 &&
    costErrors.length === 0 &&
    durationErrors.length === 0 &&
    cost.trim().length > 0 &&
    duration.trim().length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      if (isNew) {
        await createService({
          name: name.trim(),
          description: description.trim() || undefined,
          cost: Number(cost),
          duration: Number(duration),
          category: category || undefined,
          localId,
        });
      } else {
        await updateService(Number(id), {
          name: name.trim(),
          description: description.trim() || undefined,
          cost: Number(cost),
          duration: Number(duration),
          category: category || undefined,
        });
      }
      router.push("/local/services");
    } catch {
      setError("No se pudo guardar el servicio. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!isNew && isLoadingServices) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
        Cargando servicio...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/local/services"
          className="text-white/48 hover:text-white/72 transition-colors duration-150"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-[1.5rem] font-bold">
            {isNew ? "Nuevo servicio" : "Editar servicio"}
          </h1>
          <p className="text-white/54 text-[0.9rem]">
            {isNew
              ? "Agrega un servicio a tu local"
              : "Modifica los datos del servicio"}
          </p>
        </div>
      </div>

      <form className="grid gap-[1.1rem] max-w-lg" onSubmit={handleSubmit}>
        <InputField
          label="Nombre del servicio"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          errors={nameErrors}
        />

        <TextareaField
          label="Descripcion (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Precio (ARS)"
            type="number"
            value={cost}
            onChange={(e) => handleCostChange(e.target.value)}
            errors={costErrors}
          />
          <InputField
            label="Duracion (minutos)"
            type="number"
            value={duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            errors={durationErrors}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-[0.85rem] font-medium text-white/72">
            Categoria (opcional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-white/16 bg-white/[0.04] px-4 py-3 text-white outline-none transition-[border-color] duration-150 focus:border-[#00f068]/50"
          >
            <option value="">Sin categoria</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
            {error}
          </div>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Link href="/local/services">
            <Button variant="secondary" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={!isFormValid || loading}>
            {loading
              ? "Guardando..."
              : isNew
                ? "Crear servicio"
                : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
