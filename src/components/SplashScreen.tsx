"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Pantalla de entrada con la atribucion de marca del estudio.
 *
 * Se monta en el layout raiz (`src/app/layout.tsx`), igual criterio que
 * `SiteFooter`: asi cubre todas las rutas de `client-web` — y en particular el
 * flujo `/booking/*`, que es el que ven los clientes finales del local — sin
 * duplicar el componente en `BookingShell` ni en cada route group.
 *
 * Es client-side only a proposito: devuelve `null` en el servidor **y** en el
 * primer render de cliente, y decide recien en el `useEffect`. Si el valor
 * inicial dependiera de `window`, servidor y cliente diferirian y React tiraria
 * un hydration mismatch. El costo es un frame de contenido debajo antes de que
 * entre el overlay; el flash inverso (splash parpadeando) seria peor.
 *
 * El layout raiz persiste entre navegaciones client-side, asi que el componente
 * no se remonta: el splash aparece una vez por carga completa de pagina y no
 * reaparece al moverse por el flujo de reserva.
 */

const VISIBLE_MS = 1600;
/** Debe coincidir con `duration-300` del overlay: Tailwind no lee esta constante. */
const FADE_MS = 300;

type Phase = "pending" | "visible" | "leaving" | "done";

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("pending");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    setReduceMotion(reduced);
    setPhase("visible");

    const toLeaving = window.setTimeout(() => setPhase("leaving"), VISIBLE_MS);
    const toDone = window.setTimeout(
      () => setPhase("done"),
      VISIBLE_MS + FADE_MS,
    );

    return () => {
      window.clearTimeout(toLeaving);
      window.clearTimeout(toDone);
    };
  }, []);

  if (phase === "pending" || phase === "done") return null;

  return (
    <div
      data-testid="splash-screen"
      aria-hidden="true"
      onClick={() => setPhase("done")}
      className={cn(
        // z-[100] queda por encima del header sticky de BookingShell (z-30).
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background px-4",
        !reduceMotion && "transition-opacity duration-300",
        phase === "leaving" && "opacity-0",
      )}
    >
      <p className="font-body text-xs tracking-[0.3em] text-muted-foreground">
        POWERED BY
      </p>

      {/* <img> y ruta absoluta por consistencia con `src/components/Logo.tsx`.
          El SVG es ~3:1; el ancho relativo al viewport evita el desborde a 390px. */}
      <img
        src="/anomal-logo-white.svg"
        alt="ANØMAL"
        className="h-auto w-[min(72vw,340px)]"
      />

      <p className="font-display text-sm tracking-[0.25em] text-foreground">
        SOFTWARE A MEDIDA
      </p>
    </div>
  );
}
