"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Image as ImageIcon,
  Ban,
  Users,
  Wrench,
  UserCircle,
  CreditCard,
  Crown,
  Gift,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { PlanBadge, TrialCountdown } from "@/components/premium";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumStatusQuery } from "@/hooks/queries/usePremiumStatusQuery";

const navItems: NavItem[] = [
  { to: "/local/dashboard", label: "Panel", icon: <LayoutDashboard className="size-5" /> },
  { to: "/local/calendar", label: "Turnos", icon: <CalendarDays className="size-5" /> },
  { to: "/local/schedules", label: "Horarios", icon: <CalendarDays className="size-5" /> },
  { to: "/local/employees", label: "Empleados", icon: <Users className="size-5" /> },
  { to: "/local/services", label: "Servicios", icon: <Wrench className="size-5" /> },
  { to: "/local/blockings", label: "Bloqueos", icon: <Ban className="size-5" /> },
  { to: "/local/images", label: "Fotos", icon: <ImageIcon className="size-5" /> },
  { to: "/local/payment-methods", label: "Métodos de cobro", icon: <CreditCard className="size-5" /> },
  { to: "/local/loyalty", label: "Fidelidad", icon: <Gift className="size-5" /> },
  { to: "/local/premium", label: "Planes", icon: <Crown className="size-5" /> },
  { to: "/local/profile", label: "Perfil", icon: <UserCircle className="size-5" /> },
];

export default function LocalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasHydrated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { data: premiumStatus } = usePremiumStatusQuery();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
    } else if (!user.isLocal) {
      router.replace("/home");
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-muted-foreground">
        Cargando...
      </div>
    );
  }

  // El wizard de onboarding no usa la sidebar. Lo renderizamos como una
  // pantalla centrada, limpia, para que el foco este en los pasos.
  if (pathname?.startsWith("/local/onboarding")) {
    return (
      <div className="min-h-screen p-5 max-sm:p-3">
        <main className="grid place-items-center">{children}</main>
      </div>
    );
  }

  const identity = (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <p className="mb-1 text-[0.7rem] uppercase tracking-wider text-muted-foreground">
        Local
      </p>
      <strong className="text-sm text-foreground">
        {user?.localName || user?.name}
      </strong>
      {premiumStatus && (
        <div className="mt-2">
          <PlanBadge tier={premiumStatus.tier} />
        </div>
      )}
      {premiumStatus?.status === "trial" && premiumStatus.trialEndDate && (
        <div className="mt-2">
          <TrialCountdown trialEndDate={premiumStatus.trialEndDate} />
        </div>
      )}
    </div>
  );

  return (
    <AppShell
      homeHref="/local/dashboard"
      tagline="Panel de administración del local"
      navItems={navItems}
      identity={identity}
      onLogout={logout}
    >
      {children}
    </AppShell>
  );
}
