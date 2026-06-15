"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { LogoMark } from "@/components/Logo";
import {
  IconHome,
  IconCalendar,
  IconUser,
  IconLogout,
  IconPayment,
} from "@/components/Icons";
import { useAuthStore } from "@/stores/auth";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasHydrated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  console.log('pathname', pathname);
  useEffect(() => {
    // if (hasHydrated && !user ) {
    //   router.replace("/login");
    // }
  }, [hasHydrated, user, router]);

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).catch(console.error);
    logout();
    setIsMobileMenuOpen(false);
  }

  function handleMobileNavigation() {
    setIsMobileMenuOpen(false);
  }

  const navLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 whitespace-nowrap rounded-[18px] border px-[1.1rem] py-4 text-white/75 bg-white/[0.02] transition-[background-color,color,border-color,transform] duration-150 hover:-translate-y-px max-sm:rounded-[14px] max-sm:px-[0.95rem] max-sm:py-[0.7rem] max-sm:text-[0.92rem] [&>svg]:h-5 [&>svg]:w-5 max-sm:[&>svg]:h-4 max-sm:[&>svg]:w-4 ${
      isActive
        ? "border-[#00f068]/40 bg-[#00f068]/14 text-[#eafff3]"
        : "border-transparent"
    }`;
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
        Cargando...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[300px_1fr] gap-5 min-h-screen p-5 max-lg:grid-cols-1 max-sm:gap-3 max-sm:p-3">
      <aside className="self-start sticky top-5 h-[calc(100vh-2.5rem)] overflow-y-auto p-6 flex flex-col gap-8 justify-between border border-white/10 bg-[rgba(10,10,10,0.9)] rounded-[28px] shadow-[0_24px_65px_rgba(0,0,0,0.38)] backdrop-blur-md max-sm:hidden">
        <div>
          <Link href="/home" className="flex items-center gap-2 mb-4">
            <LogoMark />
          </Link>
          <h3 className="max-w-[20rem] text-white/58">
            Reservas, pagos y perfil en una sola web.
          </h3>
        </div>

        <nav className="grid gap-3">
          <Link className={navLinkClass("/home")} href="/home">
            <IconHome />
            <span>Inicio</span>
          </Link>
          <Link
            className={navLinkClass("/booking/select-local")}
            href="/booking/select-local"
          >
            <IconCalendar />
            <span>Reservar</span>
          </Link>
          <Link
            className={navLinkClass("/appointments")}
            href="/appointments"
          >
            <IconCalendar />
            <span>Mis turnos</span>
          </Link>
          <Link className={navLinkClass("/profile")} href="/profile">
            <IconUser />
            <span>Perfil</span>
          </Link>
          <Link className={navLinkClass("/payments")} href="/payments">
            <IconPayment />
            <span>Ver Pagos</span>
          </Link>
        </nav>

        <div className="grid gap-[0.85rem]">
          <div>
            <strong>{user?.name}</strong>
            <p className="text-white/54 text-sm">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center gap-3 whitespace-nowrap rounded-[18px] border px-[1.1rem] py-4 text-white/75 bg-white/[0.02] transition-[background-color,color,border-color,transform] duration-150 hover:-translate-y-px border-[#ff5678]/40 hover:bg-[#ff5678]/14 hover:text-[#ffd7e0] [&>svg]:h-5 [&>svg]:w-5"
          >
            <IconLogout />
            <span>Cerrar sesion</span>
          </Button>
        </div>
      </aside>

      <main className="p-6 border border-white/10 bg-[#0f1014] rounded-[28px] shadow-[0_12px_32px_rgba(0,0,0,0.28)] overflow-y-auto max-sm:order-2 max-sm:p-4 max-sm:rounded-[22px]">
        <div className="hidden max-sm:flex items-center justify-between gap-3 pb-4">
          <Link href="/home" className="flex items-center gap-2">
            <LogoMark />
          </Link>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() =>
              setIsMobileMenuOpen((current) => !current)
            }
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00f068]/22 bg-[#0a0a0a] text-[#00f068] shadow-[0_10px_24px_rgba(0,0,0,0.34)]"
          >
            <span className="flex h-4 w-5 flex-col justify-between">
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-150 ${
                  isMobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-opacity duration-150 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-150 ${
                  isMobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>

        {isMobileMenuOpen ? (
          <div className="hidden max-sm:grid gap-4 mb-4 rounded-[22px] border border-white/10 bg-[rgba(10,10,10,0.96)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.34)]">
            <nav className="grid gap-2">
              <Link
                className={navLinkClass("/home")}
                href="/home"
                onClick={handleMobileNavigation}
              >
                <IconHome />
                <span>Inicio</span>
              </Link>
              <Link
                className={navLinkClass("/booking/select-local")}
                href="/booking/select-local"
                onClick={handleMobileNavigation}
              >
                <IconCalendar />
                <span>Reservar</span>
              </Link>
              <Link
                className={navLinkClass("/appointments")}
                href="/appointments"
                onClick={handleMobileNavigation}
              >
                <IconCalendar />
                <span>Mis turnos</span>
              </Link>
              <Link
                className={navLinkClass("/profile")}
                href="/profile"
                onClick={handleMobileNavigation}
              >
                <IconUser />
                <span>Perfil</span>
              </Link>
              <Link
                className={navLinkClass("/payments")}
                href="/payments"
                onClick={handleMobileNavigation}
              >
                <IconPayment />
                <span>Ver pagos</span>
              </Link>
            </nav>

            <div className="grid gap-3 border-t border-[#00f068]/12 pt-3">
              <div>
                <strong>{user?.name}</strong>
                <p className="text-white/54">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-3 whitespace-nowrap rounded-[18px] border px-[1.1rem] py-4 text-white/75 bg-white/[0.02] transition-[background-color,color,border-color,transform] duration-150 hover:-translate-y-px border-[#ff5678]/40 hover:bg-[#ff5678]/14 hover:text-[#ffd7e0] max-sm:px-[0.95rem] max-sm:py-[0.7rem] max-sm:text-[0.92rem] [&>svg]:h-5 [&>svg]:w-5 max-sm:[&>svg]:h-4 max-sm:[&>svg]:w-4"
              >
                <IconLogout />
                <span>Cerrar sesion</span>
              </Button>
            </div>
          </div>
        ) : null}

        {children}
      </main>
    </div>
  );
}
