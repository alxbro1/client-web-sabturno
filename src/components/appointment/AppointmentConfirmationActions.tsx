"use client";

import { useState } from "react";
import { CalendarPlus, Share2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildGoogleCalendarUrl,
  buildIcsContent,
  buildShareText,
} from "@/lib/calendar/buildCalendarEvent";
import type { AppointmentPublicDetails } from "@/lib/types/booking";
import { bookingService } from "@/services/booking";

const ICS_FILE_NAME = "turno-sabturno.ics";
const GENERIC_CANCEL_ERROR = "No se pudo cancelar el turno. Intentalo de nuevo.";

interface AppointmentConfirmationActionsProps {
  appointment: AppointmentPublicDetails;
}

type CancelState = "idle" | "confirming" | "loading" | "cancelled" | "error";

function downloadIcsFile(icsContent: string) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = ICS_FILE_NAME;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildRegisterHref(appointment: AppointmentPublicDetails): string {
  const params = new URLSearchParams();
  if (appointment.userName) params.set("name", appointment.userName);
  if (appointment.email) params.set("email", appointment.email);
  if (appointment.phoneNumber) params.set("phone", appointment.phoneNumber);

  const query = params.toString();
  return query ? `/register?${query}` : "/register";
}

function extractErrorMessage(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || GENERIC_CANCEL_ERROR
  );
}

export function AppointmentConfirmationActions({
  appointment,
}: AppointmentConfirmationActionsProps) {
  const [cancelState, setCancelState] = useState<CancelState>("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const googleCalendarUrl = buildGoogleCalendarUrl(appointment);
  const isGuestBooking = !appointment.userId;

  function requestCancel() {
    setCancelError(null);
    setCancelState("confirming");
  }

  function dismissConfirm() {
    setCancelState("idle");
  }

  async function confirmCancel() {
    setCancelState("loading");
    setCancelError(null);

    try {
      const appointmentId = String(appointment.id);
      if (appointment.accessHash) {
        await bookingService.cancelAppointmentPublic(appointmentId, appointment.accessHash);
      } else {
        await bookingService.cancelBooking(appointmentId);
      }
      setCancelState("cancelled");
    } catch (error) {
      setCancelError(extractErrorMessage(error));
      setCancelState("error");
    }
  }

  async function handleShare() {
    const shareText = buildShareText(appointment);
    const icsContent = buildIcsContent(appointment);

    if (typeof navigator.share === "function") {
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      const icsFile = new File([icsContent], ICS_FILE_NAME, { type: "text/calendar" });
      const canShareFiles = typeof nav.canShare === "function" && nav.canShare({ files: [icsFile] });

      try {
        if (canShareFiles) {
          await navigator.share({ text: shareText, files: [icsFile] });
        } else {
          await navigator.share({ text: shareText });
        }
        return;
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") {
          return;
        }
        // Fall through to the manual download/copy fallback below.
      }
    }

    downloadIcsFile(icsContent);
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Turno guardado: se descargó el archivo .ics y copiamos los datos al portapapeles");
    } catch {
      toast.success("Se descargó el archivo .ics del turno");
    }
  }

  if (cancelState === "cancelled") {
    return (
      <div role="status" className="rounded-xl border border-border bg-card p-4 text-center text-sm text-foreground">
        Turno cancelado correctamente.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {cancelState === "confirming" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <span className="text-sm text-muted-foreground">¿Estás seguro?</span>
          <Button variant="danger" onClick={confirmCancel}>
            Confirmar cancelación
          </Button>
          <Button variant="ghost" onClick={dismissConfirm}>
            <X className="size-4" aria-hidden="true" />
            No, volver
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Agregar a Google Calendar"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 rounded-xl px-1 text-xs font-semibold sm:text-sm",
            )}
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Calendario
          </a>

          <Button
            variant="secondary"
            aria-label="Guardar o compartir turno"
            className="h-11 px-1 text-xs sm:text-sm"
            onClick={handleShare}
          >
            <Share2 className="size-4" aria-hidden="true" />
            Compartir
          </Button>

          <Button
            variant="danger"
            aria-label="Cancelar turno"
            className="h-11 px-1 text-xs sm:text-sm"
            onClick={requestCancel}
            disabled={cancelState === "loading"}
          >
            {cancelState === "loading" ? "Cancelando…" : "Cancelar"}
          </Button>
        </div>
      )}

      {cancelState === "error" && cancelError ? (
        <p role="alert" className="text-sm text-destructive">
          {cancelError}
        </p>
      ) : null}

      {isGuestBooking ? (
        <a
          href={buildRegisterHref(appointment)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          <UserPlus className="size-4" aria-hidden="true" />
          Crear cuenta para gestionar tus turnos
        </a>
      ) : null}
    </div>
  );
}
