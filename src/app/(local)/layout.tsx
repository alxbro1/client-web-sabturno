"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { LogoMark } from "@/components/Logo";
import { useAuthStore } from "@/stores/auth";

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  );
}

function IconSchedule() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  );
}

function IconBlock() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: "/local/dashboard", label: "Panel", icon: <IconDashboard /> },
  { to: "/local/calendar", label: "Turnos", icon: <IconSchedule /> },
  { to: "/local/schedules", label: "Horarios", icon: <IconSchedule /> },
  { to: "/local/blockings", label: "Bloqueos", icon: <IconBlock /> },
  { to: "/local/images", label: "Fotos", icon: <IconImage /> },
  {
    to: "/local/profile",
    label: "Perfil",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
  },
];

export default function LocalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasHydrated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).catch(console.error);
    logout();
    setIsMobileMenuOpen(false);
    router.replace("/login");
  }

  function handleMobileNavigation() {
    setIsMobileMenuOpen(false);
  }

  const navLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 whitespace-nowrap rounded-[18px] border px-[1.1rem] py-4 text-white/75 bg-white/[0.02] transition-[background-color,color,border-color,transform] duration-150 hover:-translate-y-px max-sm:rounded-[14px] max-sm:px-[0.95rem] max-sm:py-[0.7rem] max-sm:text-[0.92rem] ${
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

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (!user.isLocal) {
    router.replace("/home");
    return null;
  }

  return (
    <div className="grid grid-cols-[280px_1fr] gap-5 min-h-screen p-5 max-lg:grid-cols-1 max-sm:gap-3 max-sm:p-3">
      <aside className="self-start sticky top-5 h-[calc(100vh-2.5rem)] overflow-y-auto p-6 flex flex-col gap-8 justify-between border border-white/10 bg-[rgba(10,10,10,0.9)] rounded-[28px] shadow-[0_24px_65px_rgba(0,0,0,0.38)] backdrop-blur-md max-sm:hidden">
        <div>
          <Link href="/local/dashboard" className="flex items-center gap-2 mb-4">
            <LogoMark />
          </Link>
          <p className="text-[0.8rem] text-white/48 max-w-[18rem]">
            Panel de administracion del local
          </p>
        </div>

        <nav className="grid gap-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              className={navLinkClass(item.to)}
              href={item.to}
              onClick={handleMobileNavigation}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="grid gap-[0.85rem]">
          <div className="p-3 rounded-[18px] border border-white/10 bg-white/[0.02]">
            <p className="text-[0.75rem] text-white/48 uppercase tracking-wider mb-1">
              Local
            </p>
            <strong className="text-[0.95rem] text-white">
              {user?.localName || user?.name}
            </strong>
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
          <Link href="/local/dashboard" className="flex items-center gap-2">
            <LogoMark />
          </Link>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00f068]/22 bg-[#0a0a0a] text-[#00f068] shadow-[0_10px_24px_rgba(0,0,0,0.34)]"
          >
            {isMobileMenuOpen ? (
              <IconClose />
            ) : (
              <span className="flex h-4 w-5 flex-col justify-between">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            )}
          </button>
        </div>

        {isMobileMenuOpen ? (
          <div className="hidden max-sm:grid gap-4 mb-4 rounded-[22px] border border-white/10 bg-[rgba(10,10,10,0.96)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.34)]">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  className={navLinkClass(item.to)}
                  href={item.to}
                  onClick={handleMobileNavigation}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="grid gap-3 border-t border-[#00f068]/12 pt-3">
              <div>
                <strong>{user?.localName || user?.name}</strong>
                <p className="text-white/54 text-sm">{user?.email}</p>
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
