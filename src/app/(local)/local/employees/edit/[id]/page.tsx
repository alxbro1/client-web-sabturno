"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import { useEmployeesQuery } from "@/hooks/queries/useEmployeesQuery";
import { useAuthStore } from "@/stores/auth";
import type { Employee } from "@/lib/types/employee";

const COLORS = [
  "#00f068",
  "#7bcfff",
  "#ff5678",
  "#ffd700",
  "#a78bfa",
  "#f97316",
  "#06b6d4",
  "#ec4899",
];

export default function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const localId = user?.id ?? "";
  const isNew = id === "new";

  const {
    employees,
    isLoading: isLoadingEmployees,
    createEmployee,
    updateEmployee,
  } = useEmployeesQuery(localId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameErrors, setNameErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isNew && employees.length > 0) {
      const employee = employees.find((e) => e.id === id);
      if (employee) {
        setName(employee.name);
        setEmail(employee.email || "");
        setPhone(employee.phone || "");
        setColor(employee.color || COLORS[0]);
      }
    }
  }, [isNew, id, employees]);

  function validateName(value: string): string[] {
    const errors: string[] = [];
    if (value.trim().length === 0) {
      errors.push("El nombre es requerido");
    }
    return errors;
  }

  function handleNameChange(value: string) {
    setName(value);
    setNameErrors(validateName(value));
  }

  const isFormValid = name.trim().length > 0 && nameErrors.length === 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      if (isNew) {
        await createEmployee({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          color,
        });
      } else {
        await updateEmployee(id, {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          color,
        });
      }
      router.push("/local/employees");
    } catch {
      setError("No se pudo guardar el empleado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!isNew && isLoadingEmployees) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
        Cargando empleado...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/local/employees"
          className="text-white/48 hover:text-white/72 transition-colors duration-150"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[1.5rem] font-bold">
            {isNew ? "Nuevo empleado" : "Editar empleado"}
          </h1>
          <p className="text-white/54 text-[0.9rem]">
            {isNew
              ? "Agrega un empleado a tu local"
              : "Modifica los datos del empleado"}
          </p>
        </div>
      </div>

      <form className="grid gap-[1.1rem] max-w-lg" onSubmit={handleSubmit}>
        <InputField
          label="Nombre"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          errors={nameErrors}
        />

        <InputField
          label="Correo electronico (opcional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <InputField
          label="Telefono (opcional)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="grid gap-2">
          <label className="text-[0.85rem] font-medium text-white/72">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-9 h-9 rounded-full transition-[transform,box-shadow] duration-150 ${
                  color === c
                    ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0f1014]"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
            {error}
          </div>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Link href="/local/employees">
            <Button variant="secondary" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={!isFormValid || loading}>
            {loading
              ? "Guardando..."
              : isNew
                ? "Crear empleado"
                : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
