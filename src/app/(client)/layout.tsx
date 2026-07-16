"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, CalendarDays, User, LogOut, CreditCard, Menu } from "lucide-react";
import { Button } from "@/components/Button";
import { LogoMark } from "@/components/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasHydrated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
    }
  }, [hasHydrated, user, router]);

  function handleLogout() {
    logout();
  }

  const isActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) => {
    const active = isActive(path);
    return [
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary border border-primary/30"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent",
    ].join(" ");
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-muted-foreground">
        Cargando...
      </div>
    );
  }

  const sidebar = (
    <aside className="self-start sticky top-5 h-[calc(100vh-2.5rem)] overflow-y-auto p-6 flex flex-col gap-8 justify-between bg-card border border-border shadow-sm rounded-xl max-sm:hidden">
      <div>
        <Link href="/home" className="flex items-center gap-2 mb-4">
          <LogoMark />
        </Link>
        <h3 className="text-muted-foreground text-sm max-w-[20rem]">
          Reservas, pagos y perfil en una sola web.
        </h3>
      </div>

      <nav className="grid gap-1.5">
        <Link className={navLinkClass("/home")} href="/home">
          <Home className="size-5" />
          <span>Inicio</span>
        </Link>
        <Link
          className={navLinkClass("/booking/select-local")}
          href="/booking/select-local"
        >
          <CalendarDays className="size-5" />
          <span>Reservar</span>
        </Link>
        <Link
          className={navLinkClass("/appointments")}
          href="/appointments"
        >
          <CalendarDays className="size-5" />
          <span>Mis turnos</span>
        </Link>
        <Link className={navLinkClass("/profile")} href="/profile">
          <User className="size-5" />
          <span>Perfil</span>
        </Link>
        <Link className={navLinkClass("/payments")} href="/payments">
          <CreditCard className="size-5" />
          <span>Ver Pagos</span>
        </Link>
      </nav>

      <div className="grid gap-3">
        <div>
          <strong className="text-foreground">{user?.name}</strong>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive [&>svg]:size-5"
        >
          <LogOut />
          <span>Cerrar sesion</span>
        </Button>
      </div>
    </aside>
  );

  const mobileNavItems = (
    <nav className="grid gap-1.5">
      <Link
        className={navLinkClass("/home")}
        href="/home"
      >
        <Home className="size-5" />
        <span>Inicio</span>
      </Link>
      <Link
        className={navLinkClass("/booking/select-local")}
        href="/booking/select-local"
      >
        <CalendarDays className="size-5" />
        <span>Reservar</span>
      </Link>
      <Link
        className={navLinkClass("/appointments")}
        href="/appointments"
      >
        <CalendarDays className="size-5" />
        <span>Mis turnos</span>
      </Link>
      <Link
        className={navLinkClass("/profile")}
        href="/profile"
      >
        <User className="size-5" />
        <span>Perfil</span>
      </Link>
      <Link
        className={navLinkClass("/payments")}
        href="/payments"
      >
        <CreditCard className="size-5" />
        <span>Ver pagos</span>
      </Link>
    </nav>
  );

  return (
    <div className="grid grid-cols-[300px_1fr] gap-5 min-h-screen p-5 max-lg:grid-cols-1 max-sm:gap-3 max-sm:p-3">
      {sidebar}

      <main className="p-6 bg-card border border-border shadow-sm rounded-xl overflow-y-auto max-sm:order-2 max-sm:p-4 max-sm:rounded-xl">
        <div className="hidden max-sm:flex items-center justify-between gap-3 pb-4">
          <Link href="/home" className="flex items-center gap-2">
            <LogoMark />
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-card text-primary"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:max-w-[280px]">
              <SheetHeader className="pb-0">
                <SheetTitle className="flex items-center gap-2">
                  <LogoMark />
                  <span className="sr-only">Menu</span>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4">
                {mobileNavItems}

                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <div>
                    <strong className="text-foreground">{user?.name}</strong>
                    <p className="text-muted-foreground text-sm">{user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive [&>svg]:size-5"
                  >
                    <LogOut />
                    <span>Cerrar sesion</span>
                  </Button>
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
