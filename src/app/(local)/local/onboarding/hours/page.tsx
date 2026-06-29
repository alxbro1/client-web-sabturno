"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/stores/auth";
import { useOnboardingStore } from "@/stores/onboarding";
import { scheduleService } from "@/features/local/services/schedule.service";
import { localService } from "@/features/local/services/local.service";
import { cn } from "@/lib/utils";
import type { Schedule, DaySchedule } from "@/features/local/types/schedule.types";
import type { DayKey } from "@/features/local/types/schedule.types";

interface DayConfig {
  key: DayKey;
  label: string;
}

const DAYS: DayConfig[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miercoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sabado" },
  { key: "sunday", label: "Domingo" },
];

interface DayState {
  active: boolean;
  open: string;
  close: string;
}

type ScheduleForm = Record<DayKey, DayState>;

function makeDefaultSchedule(): ScheduleForm {
  const obj = {} as ScheduleForm;
  for (const day of DAYS) {
    obj[day.key] = {
      active: day.key !== "sunday",
      open: "09:00",
      close: "18:00",
    };
  }
  return obj;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Step 3 del wizard: configurar plantilla de horarios semanal.
 *
 * - Crea un `ScheduleTemplate` con un slot por dia activo via
 *   `POST /time-stock-template` (ver
 *   `backend/src/timestock-template/timestock-template.controller.ts:28-33`).
 * - El backend espera `name`, `localId` y `schedule.{day}.{active,timeSlots[]}`.
 * - "Saltar" permite ir al panel sin configurar (se puede hacer despues
 *   desde /local/schedules).
 */
export default function OnboardingHoursPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setHasSchedule, dismiss } = useOnboardingStore();
  const [schedule, setSchedule] = useState<ScheduleForm>(makeDefaultSchedule);
  const [errors, setErrors] = useState<Record<DayKey, string | null>>({
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null,
  });

  const localId = user?.id ?? "";

  function updateDay(day: DayKey, patch: Partial<DayState>) {
    setSchedule((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
    setErrors((current) => ({ ...current, [day]: null }));
  }

  function validate(): boolean {
    const next: Record<DayKey, string | null> = {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    };
    let ok = true;
    for (const day of DAYS) {
      const cfg = schedule[day.key];
      if (!cfg.active) continue;
      if (!cfg.open || !cfg.close) {
        next[day.key] = "Definir horario de apertura y cierre";
        ok = false;
        continue;
      }
      if (timeToMinutes(cfg.close) <= timeToMinutes(cfg.open)) {
        next[day.key] = "La hora de cierre debe ser despues de la apertura";
        ok = false;
      }
    }
    setErrors(next);
    return ok;
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const schedulePayload: Schedule = {
        monday: { active: false, timeSlots: [] },
        tuesday: { active: false, timeSlots: [] },
        wednesday: { active: false, timeSlots: [] },
        thursday: { active: false, timeSlots: [] },
        friday: { active: false, timeSlots: [] },
        saturday: { active: false, timeSlots: [] },
        sunday: { active: false, timeSlots: [] },
      };

      for (const day of DAYS) {
        const cfg = schedule[day.key];
        const daySchedule: DaySchedule = {
          active: cfg.active,
          timeSlots: cfg.active
            ? [{ start: cfg.open, end: cfg.close }]
            : [],
        };
        schedulePayload[day.key] = daySchedule;
      }

      return scheduleService.createTemplate({
        name: "Plantilla inicial",
        localId,
        schedule: schedulePayload,
      });
    },
    onSuccess: () => {
      setHasSchedule(true);
      dismiss();
      // Persistir en DB para que funcione entre dispositivos.
      localService.updateLocal(localId, { onboardingCompleted: true }).catch(console.error);
      toast.success("Horarios guardados correctamente");
      router.replace("/local/dashboard");
    },
    onError: (err: Error) => {
      console.error("Error guardando horarios:", err);
      toast.error("No se pudieron guardar los horarios. Intenta de nuevo.");
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    createMutation.mutate();
  }

  function handleSkip() {
    setHasSchedule(true);
    dismiss();
    // Persistir en DB para que funcione entre dispositivos.
    localService.updateLocal(localId, { onboardingCompleted: true }).catch(console.error);
    router.replace("/local/dashboard");
  }

  return (
    <section className="grid gap-6 max-w-2xl mx-auto">
      <header className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Paso 3 de 3
        </p>
        <h2 className="text-2xl font-bold text-foreground mt-1">
          Configura tus horarios
        </h2>
        <p className="text-muted-foreground mt-2">
          Define cuando tu local atiende al publico. Podes editarlo despues
          desde Horarios.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {DAYS.map((day) => {
          const cfg = schedule[day.key];
          return (
            <div
              key={day.key}
              className={cn(
                "rounded-2xl border p-4 transition-colors",
                cfg.active
                  ? "border-white/15 bg-white/[0.02]"
                  : "border-white/10 bg-white/[0.01] opacity-60",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={cfg.active}
                    onCheckedChange={(value) =>
                      updateDay(day.key, { active: value })
                    }
                    aria-label={`Activar ${day.label}`}
                  />
                  <span className="font-semibold text-foreground">
                    {day.label}
                  </span>
                </div>

                {cfg.active ? (
                  <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                    <InputField
                      label="Apertura"
                      type="time"
                      value={cfg.open}
                      onChange={(event) =>
                        updateDay(day.key, { open: event.target.value })
                      }
                    />
                    <InputField
                      label="Cierre"
                      type="time"
                      value={cfg.close}
                      onChange={(event) =>
                        updateDay(day.key, { close: event.target.value })
                      }
                      errors={errors[day.key] ? [errors[day.key]!] : undefined}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Cerrado</span>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
          >
            Saltar por ahora
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Finalizar
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
