"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/Button";
import { LogoMark } from "@/components/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface AppShellProps {
  /** Destino del logo y de la cabecera movil. */
  homeHref: string;
  /** Bajada corta bajo el logo, en la sidebar de escritorio. */
  tagline: string;
  navItems: NavItem[];
  /** Identidad de la sesion, sobre el boton de cerrar sesion. */
  identity: React.ReactNode;
  onLogout: () => void;
  children: React.ReactNode;
}

/**
 * Marco compartido por los paneles de cliente y de dueno: sidebar de
 * escritorio, drawer movil y area de contenido.
 *
 * Existia duplicado en `(local)/layout.tsx` y `(client)/layout.tsx`, con la
 * sidebar, el `navLinkClass` y el Sheet copiados, asi que cualquier arreglo de
 * contraste o de accesibilidad habia que hacerlo dos veces.
 */
export function AppShell({
  homeHref,
  tagline,
  navItems,
  identity,
  onLogout,
  children,
}: AppShellProps) {
  const pathname = usePathname();

  const navLinkClass = (path: string) =>
    [
      "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      pathname === path
        ? "bg-primary/10 text-primary border border-primary/30"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent",
    ].join(" ");

  const nav = (
    <nav className="grid gap-1.5">
      {navItems.map((item) => (
        <Link key={item.to} className={navLinkClass(item.to)} href={item.to}>
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  const logoutButton = (
    <Button
      variant="ghost"
      onClick={onLogout}
      className="flex items-center gap-3 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive [&>svg]:size-5"
    >
      <LogOut />
      <span>Cerrar sesión</span>
    </Button>
  );

  return (
    <div className="grid min-h-screen grid-cols-[280px_1fr] gap-5 p-5 max-lg:grid-cols-1 max-sm:gap-3 max-sm:p-3">
      <aside className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col justify-between gap-8 self-start overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm max-sm:hidden">
        <div>
          <Link href={homeHref} className="mb-4 flex items-center gap-2">
            <LogoMark />
          </Link>
          <p className="max-w-[18rem] text-xs text-muted-foreground">{tagline}</p>
        </div>

        {nav}

        <div className="grid gap-3">
          {identity}
          {logoutButton}
        </div>
      </aside>

      <main className="overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm max-sm:order-2 max-sm:rounded-xl max-sm:p-4">
        <div className="hidden items-center justify-between gap-3 pb-4 max-sm:flex">
          <Link href={homeHref} className="flex items-center gap-2">
            <LogoMark />
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menú"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-primary/20 bg-card text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:max-w-[280px]">
              <SheetHeader className="pb-0">
                <SheetTitle className="flex items-center gap-2">
                  <LogoMark />
                  <span className="sr-only">Menú</span>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4">
                {nav}

                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  {identity}
                  {logoutButton}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {children}
      </main>
    </div>
  );
}
