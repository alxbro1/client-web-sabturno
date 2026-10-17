"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { InputField, SelectField } from "@/components/Field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalQuery } from "@/hooks/queries/useLocalQuery";
import { useLocalServicesQuery } from "@/hooks/queries/useLocalServicesQuery";
import { useTimelineActions } from "@/features/appointment-timeline/hooks/useTimelineActions";
import { DEFAULT_TIMEZONE } from "@/lib/constants/countries";
import {
  convertLocalToUTC,
  formatDateOnlyLocal,
  parseDateOnlyToLocal,
} from "@/lib/utils/date";
import type { BackendEmployee } from "@/services/timeline";

export const MANUAL_APPOINTMENT_ERRORS: Record<string, string> = {
  "Time slot conflicts with existing appointments":
    "Ese horario se superpone con otro turno.",
  "Time slot is blocked": "Ese horario está bloqueado.",
  "Cannot create appointments in the past":
    "No podés crear un turno en el pasado.",
  "userName is required": "Ingresá el nombre del cliente.",
  "Service does not belong to the specified local":
    "Ese servicio no pertenece a este local.",
};

const GENERIC_ERROR = "No se pudo crear el turno. Intentá nuevamente.";
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export function resolveManualAppointmentError(err: unknown): string {
  const data = (
    err as { response?: { data?: { message?: unknown; reason?: unknown } } }
  )?.response?.data;
  for (const candidate of [data?.reason, data?.message]) {
    if (typeof candidate === "string" && MANUAL_APPOINTMENT_ERRORS[candidate]) {
      return MANUAL_APPOINTMENT_ERRORS[candidate];
    }
  }
  return GENERIC_ERROR;
}

function validateTime(value: string): string[] {
  if (!value) return ["Ingresá la hora"];
  if (!TIME_REGEX.test(value)) return ["Usá el formato HH:mm (ej. 14:30)"];
  return [];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localId: string;
  employees: BackendEmployee[];
  onCreated: () => void | Promise<void>;
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  localId,
  employees,
  onCreated,
}: NewAppointmentDialogProps) {
  const { services } = useLocalServicesQuery(localId);
  const { data: local } = useLocalQuery();
  const timezone = local?.timezone || DEFAULT_TIMEZONE;
  const { createAppointment } = useTimelineActions({ localId });

  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [userName, setUserName] = useState("");
  const [touched, setTouched] = useState({ date: false, time: false, name: false });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeServices = services.filter((s) => s.isActive);
  const activeEmployees = employees.filter((e) => e.isActive);
  const selectedService = activeServices.find((s) => String(s.id) === serviceId);

  const timeErrors = touched.time ? validateTime(time) : [];
  const dateErrors = touched.date && !date ? ["Elegí la fecha"] : [];
  const nameErrors =
    touched.name && !userName.trim() ? ["Ingresá el nombre del cliente"] : [];

  const isFormValid =
    !!selectedService &&
    !!date &&
    validateTime(time).length === 0 &&
    userName.trim().length > 0;

  const outcome =
    selectedService && validateTime(time).length === 0
      ? `Turno de ${time} a ${addMinutes(time, selectedService.duration)} — ${selectedService.name} (${selectedService.duration} min)`
      : null;

  function resetForm() {
    setServiceId("");
    setEmployeeId("");
    setDate("");
    setTime("");
    setUserName("");
    setTouched({ date: false, time: false, name: false });
    setError(null);
    setIsSubmitting(false);
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true);
      return;
    }
    if (!isSubmitting) handleClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid || !selectedService || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const [hours, minutes] = time.split(":").map(Number);
      const localDateTime = parseDateOnlyToLocal(date);
      localDateTime.setHours(hours, minutes, 0, 0);
      const startDateTime = convertLocalToUTC(localDateTime, timezone);

      await createAppointment({
        serviceId: selectedService.id,
        startDateTime,
        userName: userName.trim(),
        timezone,
        employeeId: employeeId || undefined,
      });
    } catch (err: unknown) {
      setError(resolveManualAppointmentError(err));
      setIsSubmitting(false);
      return;
    }

    try {
      await onCreated();
    } finally {
      handleClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/12 bg-[#111] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo turno</DialogTitle>
          <DialogDescription>
            Cargá un turno a mano, por ejemplo uno pedido por teléfono o en el local.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <SelectField
            label="Servicio"
            className="h-11"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="" disabled>
              Elegí un servicio
            </option>
            {activeServices.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {`${s.name} — $${s.cost} (${s.duration} min)`}
              </option>
            ))}
          </SelectField>

          {activeEmployees.length > 0 ? (
            <SelectField
              label="Profesional"
              className="h-11"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </SelectField>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <InputField
                label="Fecha"
                type="date"
                className="h-11"
                min={formatDateOnlyLocal(new Date())}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, date: true }))}
              />
              {dateErrors.map((m) => (
                <p key={m} className="text-sm text-destructive">
                  {m}
                </p>
              ))}
            </div>
            <div className="grid gap-1.5">
              <InputField
                label="Hora"
                type="time"
                className="h-11"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, time: true }))}
              />
              {timeErrors.map((m) => (
                <p key={m} className="text-sm text-destructive">
                  {m}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <InputField
              label="Nombre del cliente"
              className="h-11"
              autoComplete="off"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            />
            {nameErrors.map((m) => (
              <p key={m} className="text-sm text-destructive">
                {m}
              </p>
            ))}
          </div>

          {outcome ? (
            <p className="text-sm text-muted-foreground">{outcome}</p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-[#ff5678]/30 bg-[#ff5678]/10 p-3 text-sm text-[#ff9aae]"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 pt-2 sm:gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isFormValid || isSubmitting}
              fullWidth
            >
              {isSubmitting ? "Creando..." : "Crear turno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
