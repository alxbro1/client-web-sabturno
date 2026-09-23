"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoText } from "@/components/Logo";
import { BookingStepper } from "@/components/booking/BookingStepper";

/**
 * Marco común del flujo de reserva. `/booking` vive fuera de los route groups
 * `(client)` / `(local)`, así que sin esto las pantallas quedan sin cabecera,
 * sin salida y sin indicación de progreso.
 */
export function BookingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFlowStep =
    /^\/booking\/(select-local|select-service|select-professional|appointment|payment)$/.test(
      pathname,
    );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label="Ir al inicio de SabTurno">
            <LogoText />
          </Link>
          <Link
            href="/"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Salir de la reserva
          </Link>
        </div>
        {isFlowStep ? (
          <div className="mx-auto w-full max-w-3xl px-4 pb-3">
            <BookingStepper />
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4">{children}</main>
    </div>
  );
}
