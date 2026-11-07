"use client";

import { useEffect, useState } from "react";

/**
 * Pantalla de entrada con la atribucion de marca del estudio.
 *
 * Se monta en el layout raiz (`src/app/layout.tsx`), igual criterio que
 * `SiteFooter`: asi cubre todas las rutas de `client-web` — y en particular el
 * flujo `/booking/*`, que es el que ven los clientes finales del local — sin
 * duplicarlo en `BookingShell` ni en cada route group.
 *
 * ## Por que se renderiza en el servidor
 *
 * Tiene que aparecer antes que cualquier otro contenido, incluido el
 * "Cargando..." de `src/app/loading.tsx` y de `src/app/page.tsx`. Eso obliga a
 * que el overlay venga en el HTML del servidor: si se decidiera en un
 * `useEffect`, el primer paint seria la app y el splash entraria un frame
 * despues, tapando algo que el usuario ya vio.
 *
 * No hay hydration mismatch porque el estado inicial no depende de `window`:
 * servidor y primer render de cliente producen exactamente el mismo markup.
 *
 * ## Por que la salida la maneja CSS
 *
 * La animacion `animate-splash-out` (definida en `src/styles.css`) arranca en
 * el primer paint, antes de que React hidrate. Si la salida dependiera de un
 * timer de JS y la hidratacion tardara o fallara, el overlay quedaria pegado
 * tapando la app sin forma de cerrarlo. Con CSS el splash se va igual.
 *
 * El JS solo desmonta el nodo una vez que ya es invisible, y permite
 * descartarlo con un click.
 *
 * ## Frecuencia
 *
 * El layout raiz persiste entre navegaciones client-side, asi que el
 * componente no se remonta: el splash aparece una vez por carga completa de
 * pagina y no reaparece al moverse por el flujo de reserva.
 */

/**
 * Duracion total de la animacion de salida.
 * Debe coincidir con `--animate-splash-out` en `src/styles.css`.
 */
const SPLASH_TOTAL_MS = 1900;

export function SplashScreen() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Backstop de `onAnimationEnd`: si la hidratacion llega despues de que la
    // animacion termino, el evento ya paso y nadie lo escucho. El nodo ya es
    // invisible e inerte (`visibility: hidden`), esto solo lo saca del DOM.
    const timer = window.setTimeout(() => setDone(true), SPLASH_TOTAL_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <div
      data-testid="splash-screen"
      aria-hidden="true"
      onClick={() => setDone(true)}
      onAnimationEnd={() => setDone(true)}
      // z-[100] queda por encima del header sticky de BookingShell (z-30).
      className="animate-splash-out fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background px-4"
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
