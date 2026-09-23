"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { segment: "select-local", label: "Local" },
  { segment: "select-service", label: "Servicio" },
  { segment: "select-professional", label: "Profesional" },
  { segment: "appointment", label: "Fecha y hora" },
  { segment: "payment", label: "Pago" },
] as const;

export function BookingStepper() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((step) =>
    pathname.startsWith(`/booking/${step.segment}`),
  );

  if (currentIndex < 0) return null;

  return (
    <nav aria-label="Progreso de la reserva" className="w-full">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.segment} className="flex flex-1 items-center gap-2">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isDone && !isCurrent && "border-border text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-xs font-medium max-sm:sr-only",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px flex-1 rounded-full",
                    isDone ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="sr-only">
        Paso {currentIndex + 1} de {STEPS.length}: {STEPS[currentIndex].label}
      </p>
    </nav>
  );
}
