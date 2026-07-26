"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Clock3,
  CreditCard,
  Mail,
  Phone,
  Scissors,
  UserRound,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale/es";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/date";
import type { Appointment, Resource } from "@/features/appointment-timeline/types";

type PendingAction = "confirm" | "cancel" | null;

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  resources: Resource[];
  isMutating: boolean;
  mutationError: string | null;
  onClose: () => void;
  onConfirm: (appointment: Appointment) => Promise<void>;
  onCancel: (appointment: Appointment) => Promise<void>;
}

const STATUS_LABELS: Record<Appointment["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH_IN_FRONT: "Efectivo en el local",
  MERCADO_PAGO: "Mercado Pago",
  TRANSFERENCE: "Transferencia",
  RESERVATION_PAYMENT: "Pago de reserva",
  TALO: "Talo",
};

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/40">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function AppointmentDetailsDialog({
  appointment,
  resources,
  isMutating,
  mutationError,
  onClose,
  onConfirm,
  onCancel,
}: AppointmentDetailsDialogProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const employeeName = useMemo(
    () =>
      resources.find((resource) => resource.id === appointment?.resourceId)?.name ||
      "Sin asignar",
    [appointment?.resourceId, resources],
  );

  if (!appointment) return null;

  const timezone =
    appointment.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "America/Argentina/Buenos_Aires";
  const isFuture = appointment.startAt.getTime() > Date.now();
  const canConfirm =
    appointment.status === "PENDING" && appointment.paymentMethod === "CASH_IN_FRONT";
  const canCancel =
    isFuture &&
    (appointment.status === "PENDING" || appointment.status === "CONFIRMED");
  const dateLabel = formatInTimeZone(
    appointment.startAt,
    timezone,
    "EEEE d 'de' MMMM 'de' yyyy",
    { locale: es },
  );
  const timeLabel = `${formatInTimeZone(
    appointment.startAt,
    timezone,
    "HH:mm",
  )}–${formatInTimeZone(appointment.endAt, timezone, "HH:mm")} hs`;

  const executeAction = async () => {
    if (!pendingAction) return;
    try {
      if (pendingAction === "confirm") {
        await onConfirm(appointment);
      } else {
        await onCancel(appointment);
      }
      setPendingAction(null);
    } catch {
      // El coordinador conserva el modal abierto y muestra el error de la API.
    }
  };

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !isMutating) onClose();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/12 bg-[#111] sm:max-w-2xl">
          <DialogHeader>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#00f068]/25 bg-[#00f068]/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#00f068]">
                {STATUS_LABELS[appointment.status]}
              </span>
              <span className="text-xs text-white/35">Turno #{appointment.id}</span>
            </div>
            <DialogTitle className="text-2xl">
              {appointment.customerName || "Cliente sin nombre"}
            </DialogTitle>
            <DialogDescription>
              Revisá los datos del turno antes de realizar una acción.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Detail
              icon={<Scissors className="size-3.5" />}
              label="Servicio"
              value={appointment.serviceName || "Sin especificar"}
            />
            <Detail
              icon={<UserRound className="size-3.5" />}
              label="Profesional"
              value={employeeName}
            />
            <Detail
              icon={<CalendarClock className="size-3.5" />}
              label="Fecha"
              value={dateLabel}
            />
            <Detail icon={<Clock3 className="size-3.5" />} label="Horario" value={timeLabel} />
            <Detail
              icon={<CreditCard className="size-3.5" />}
              label="Pago"
              value={
                appointment.paymentMethod
                  ? PAYMENT_LABELS[appointment.paymentMethod] || appointment.paymentMethod
                  : "Sin especificar"
              }
            />
            <Detail
              icon={<CreditCard className="size-3.5" />}
              label="Precio"
              value={
                typeof appointment.price === "number"
                  ? formatCurrency(appointment.price)
                  : "Sin especificar"
              }
            />
            <Detail
              icon={<Mail className="size-3.5" />}
              label="Email"
              value={appointment.customerEmail || "Sin email"}
            />
            <Detail
              icon={<Phone className="size-3.5" />}
              label="Teléfono"
              value={appointment.customerPhone || "Sin teléfono"}
            />
          </div>

          {mutationError ? (
            <p role="alert" className="rounded-xl border border-[#ff5678]/30 bg-[#ff5678]/10 p-3 text-sm text-[#ff9aae]">
              {mutationError}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="secondary" disabled={isMutating} onClick={onClose}>
              Cerrar
            </Button>
            {canCancel ? (
              <Button
                variant="danger"
                disabled={isMutating}
                onClick={() => setPendingAction("cancel")}
              >
                Cancelar turno
              </Button>
            ) : null}
            {canConfirm ? (
              <Button
                disabled={isMutating}
                onClick={() => setPendingAction("confirm")}
              >
                Confirmar turno
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={pendingAction === "cancel" ? "Cancelar turno" : "Confirmar turno"}
        description={
          pendingAction === "cancel"
            ? `¿Querés cancelar el turno de ${appointment.customerName || "este cliente"}? El horario volverá a quedar disponible.`
            : `¿Querés confirmar el turno de ${appointment.customerName || "este cliente"}?`
        }
        confirmLabel={pendingAction === "cancel" ? "Sí, cancelar" : "Sí, confirmar"}
        isDangerous={pendingAction === "cancel"}
        isLoading={isMutating}
        onCancel={() => {
          if (!isMutating) setPendingAction(null);
        }}
        onConfirm={executeAction}
      />
    </>
  );
}
