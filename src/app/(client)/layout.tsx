"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, CalendarDays, User, CreditCard, Gift } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

const navItems: NavItem[] = [
  { to: "/home", label: "Inicio", icon: <Home className="size-5" /> },
  { to: "/booking/select-local", label: "Reservar turno", icon: <CalendarDays className="size-5" /> },
  { to: "/appointments", label: "Mis turnos", icon: <CalendarDays className="size-5" /> },
  { to: "/profile", label: "Perfil", icon: <User className="size-5" /> },
  { to: "/payments", label: "Ver pagos", icon: <CreditCard className="size-5" /> },
  { to: "/rewards", label: "Recompensas", icon: <Gift className="size-5" /> },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasHydrated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-muted-foreground">
        Cargando...
      </div>
    );
  }

  const identity = (
    <div>
      <strong className="text-foreground">{user?.name}</strong>
      <p className="text-sm text-muted-foreground">{user?.email}</p>
    </div>
  );

  return (
    <AppShell
      homeHref="/home"
      tagline="Reservas, pagos y perfil en una sola web."
      navItems={navItems}
      identity={identity}
      onLogout={logout}
    >
      {children}
    </AppShell>
  );
}
