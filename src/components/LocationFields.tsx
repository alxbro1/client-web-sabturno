"use client";

import { useEffect, useMemo, useState } from "react";
import { apiService } from "@/lib/api";
import { InputField, SelectField } from "@/components/Field";
import { Skeleton } from "@/components/ui/skeleton";
import { stateIdByName, STATE_NAMES } from "@/lib/constants/states";

export interface LocationFieldsValue {
  province: string;
  city: string;
  address: string;
  emergencyPhone: string;
}

interface LocationFieldsProps {
  value: LocationFieldsValue;
  onChange: (value: LocationFieldsValue) => void;
  errors?: {
    province?: string[];
    city?: string[];
    address?: string[];
    emergencyPhone?: string[];
  };
}

interface CityOption {
  label: string;
  value: string;
}

type CityApiItem = { id: string | number; nombre: string };

/**
 * Provincia -> Ciudad (cascada) + Direccion + Telefono de emergencia.
 *
 * - La cascada de ciudades consume el endpoint del backend
 *   `GET /location/cities_by_state/:stateId` (ver
 *   `backend/src/location/location.controller.ts`). Devuelve un array con
 *   `{ id, nombre }` y mapeamos a `{ label, value }`.
 * - El `stateId` (codigo AFIP, ej. "06" para Buenos Aires) sale de
 *   `stateIdByName[province]`. Se cachea para no re-disparar fetches al
 *   volver a la pantalla.
 * - Muestra Skeleton mientras carga las ciudades. Resetea `city` si
 *   cambia la provincia.
 */
export function LocationFields({ value, onChange, errors }: LocationFieldsProps) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const stateId = useMemo(() => {
    if (!value.province) return null;
    return stateIdByName[value.province as keyof typeof stateIdByName] ?? null;
  }, [value.province]);

  function updateField<K extends keyof LocationFieldsValue>(
    field: K,
    nextValue: LocationFieldsValue[K],
  ) {
    onChange({ ...value, [field]: nextValue });
  }

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }

    let cancelled = false;
    setLoadingCities(true);
    setCitiesError(null);

    apiService
      .get<unknown>(`/location/cities_by_state/${stateId}`)
      .then((response) => {
        if (cancelled) return;
        const data = response.data as CityApiItem[] | undefined;
        if (!Array.isArray(data)) {
          setCities([]);
          return;
        }
        setCities(
          data.map((item) => ({
            label: item.nombre,
            value: item.nombre,
          })),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error cargando ciudades:", err);
        setCitiesError("No se pudieron cargar las ciudades");
        setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stateId]);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <SelectField
          label="Provincia"
          value={value.province}
          onChange={(event) => {
            onChange({ ...value, province: event.target.value, city: "" });
          }}
          errors={errors?.province}
        >
          <option value="">Selecciona una provincia</option>
          {STATE_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>

        {loadingCities ? (
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Ciudad</span>
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <SelectField
            label="Ciudad"
            value={value.city}
            onChange={(event) => updateField("city", event.target.value)}
            errors={errors?.city}
            disabled={!value.province || cities.length === 0}
          >
            <option value="">
              {!value.province
                ? "Selecciona una provincia"
                : cities.length === 0
                  ? "Sin ciudades disponibles"
                  : "Selecciona una ciudad"}
            </option>
            {cities.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </SelectField>
        )}
      </div>

      {citiesError ? (
        <p className="text-sm text-destructive">{citiesError}</p>
      ) : null}

      <InputField
        label="Direccion del local"
        value={value.address}
        onChange={(event) => updateField("address", event.target.value)}
        errors={errors?.address}
        placeholder="Calle y numero"
        hint="La direccion donde los clientes te visitaran"
      />

      <InputField
        label="Telefono de emergencia (opcional)"
        type="tel"
        value={value.emergencyPhone}
        onChange={(event) => updateField("emergencyPhone", event.target.value)}
        errors={errors?.emergencyPhone}
        placeholder="+54 11 1234-5678"
        hint="Un segundo numero de contacto para clientes urgentes"
      />
    </div>
  );
}
