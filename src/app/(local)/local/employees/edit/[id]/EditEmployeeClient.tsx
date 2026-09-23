"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import { useEmployeesQuery } from "@/hooks/queries/useEmployeesQuery";
import { useLocalServicesQuery } from "@/hooks/queries/useLocalServicesQuery";
import { useScheduleTemplatesQuery } from "@/hooks/queries/useScheduleTemplatesQuery";
import { useAuth } from "@/hooks/useAuth";
import { useImageUpload } from "@/features/local/hooks/useImageUpload";
import { employeeService } from "@/services/employee";

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
  const { user } = useAuth();
  const localId = user?.id ?? "";
  const isNew = id === "new";

  const {
    employees,
    isLoading: isLoadingEmployees,
    createEmployee,
    updateEmployee,
  } = useEmployeesQuery(localId);
  const { services, isLoading: isLoadingServices } =
    useLocalServicesQuery(localId);
  const { data: templates = [] } = useScheduleTemplatesQuery();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameErrors, setNameErrors] = useState<string[]>([]);

  const {
    preview: photoPreview,
    hasNewImage: hasNewPhoto,
    isProcessing: isProcessingPhoto,
    error: photoError,
    selectFile: selectPhotoFile,
  } = useImageUpload();

  useEffect(() => {
    if (!isNew && employees.length > 0) {
      const employee = employees.find((e) => e.id === id);
      if (employee) {
        setName(employee.name);
        setEmail(employee.email || "");
        setPhone(employee.phone || "");
        setColor(employee.color || COLORS[0]);
        setServiceIds((employee.services ?? []).map((s) => s.id));
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

  function toggleService(serviceId: number) {
    setServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId],
    );
  }

  const isFormValid = name.trim().length > 0 && nameErrors.length === 0;

  // Domain rule 2: si no tiene plantilla propia activa, hereda la del local.
  const ownTemplate = !isNew
    ? templates.find((t) => t.employeeId === id && t.isActive)
    : undefined;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        color,
        serviceIds,
      };

      let employeeId = id;
      if (isNew) {
        const created = await createEmployee(payload);
        employeeId = created.id;
      } else {
        await updateEmployee(id, payload);
      }

      if (hasNewPhoto && photoPreview) {
        const uploaded = await employeeService.uploadEmployeeImage(
          localId,
          employeeId,
          { uri: photoPreview },
        );
        if (!uploaded) {
          setError(
            "El empleado se guardo, pero no pudimos subir la foto. Proba de nuevo desde 'Editar empleado'.",
          );
          setLoading(false);
          return;
        }
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
          className="text-muted-foreground hover:text-muted-foreground transition-colors duration-150"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-[1.5rem] font-bold">
            {isNew ? "Nuevo empleado" : "Editar empleado"}
          </h1>
          <p className="text-muted-foreground text-[0.9rem]">
            {isNew
              ? "Agrega un empleado a tu local"
              : "Modifica los datos del empleado"}
          </p>
        </div>
      </div>

      <form className="grid gap-[1.1rem] max-w-lg" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <label className="text-[0.85rem] font-medium text-muted-foreground">
            Foto (opcional)
          </label>
          <div className="flex flex-wrap items-center gap-4">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Foto del empleado"
                className="size-16 shrink-0 rounded-full border border-white/12 object-cover"
              />
            ) : (
              <div
                className="size-16 shrink-0 grid place-items-center rounded-full text-lg font-bold text-[#0a0a0a]"
                style={{ backgroundColor: color }}
              >
                {name ? (
                  name.charAt(0).toUpperCase()
                ) : (
                  <ImageIcon className="size-6 text-[#0a0a0a]/60" />
                )}
              </div>
            )}

            <div className="grid gap-1 min-w-0">
              <input
                type="file"
                id="employee-photo-input"
                accept="image/*"
                className="sr-only"
                disabled={isProcessingPhoto || loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void selectPhotoFile(file);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor="employee-photo-input"
                className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-[14px] border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/10"
              >
                <Upload className="size-4" />
                {isProcessingPhoto
                  ? "Procesando..."
                  : photoPreview
                    ? "Cambiar foto"
                    : "Subir foto"}
              </label>
              {hasNewPhoto && (
                <p className="text-sm text-muted-foreground">
                  Imagen nueva sin guardar. Se sube al guardar el empleado.
                </p>
              )}
            </div>
          </div>
          {photoError && (
            <p role="alert" className="text-sm text-[#ff9aae]">
              {photoError}
            </p>
          )}
        </div>

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
          label="Teléfono (opcional)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="grid gap-2">
          <label className="text-[0.85rem] font-medium text-muted-foreground">
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

        <fieldset className="grid gap-2">
          <legend className="text-[0.85rem] font-medium text-muted-foreground">
            Servicios que atiende
          </legend>
          {isLoadingServices ? (
            <p className="text-sm text-muted-foreground">
              Cargando servicios...
            </p>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no cargaste servicios en tu local.
            </p>
          ) : (
            <div className="grid gap-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  htmlFor={`service-${service.id}`}
                  className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3"
                >
                  <input
                    id={`service-${service.id}`}
                    type="checkbox"
                    checked={serviceIds.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="size-4"
                  />
                  {service.name}
                </label>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Si no marcás ninguno, atiende todos los servicios.
          </p>
        </fieldset>

        {!isNew && (
          <div className="grid gap-1">
            <label className="text-[0.85rem] font-medium text-muted-foreground">
              Horario
            </label>
            <p className="text-sm text-foreground">
              {ownTemplate ? (
                <>Usa su propia plantilla: <strong>{ownTemplate.name}</strong></>
              ) : (
                "Usa el horario del local (no tiene una plantilla propia activa)."
              )}
            </p>
            <Link
              href={
                ownTemplate
                  ? `/local/schedules/edit/${ownTemplate.id}`
                  : "/local/schedules"
              }
              className="text-sm font-medium text-primary hover:underline w-fit"
            >
              {ownTemplate
                ? "Editar su plantilla de horario"
                : "Crear o asignar una plantilla"}
            </Link>
          </div>
        )}

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
