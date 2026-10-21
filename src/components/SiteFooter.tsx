/**
 * Pie de pagina del sitio.
 *
 * Se monta en el layout raiz (`src/app/layout.tsx`) y no en un route group:
 * asi aparece en todas las rutas de `client-web` — los paneles `(client)` y
 * `(local)`, el flujo de reserva, los links publicos de turno y las pantallas
 * de auth — sin duplicar el componente en cada shell.
 *
 * Es un Server Component: no usa estado, hooks ni `use client`.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background/40">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-5 sm:px-6">
        <a
          href="https://anomalstudio.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-md text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Powered by <span className="font-semibold tracking-wide text-foreground">ANØMAL</span>
        </a>
      </div>
    </footer>
  );
}
