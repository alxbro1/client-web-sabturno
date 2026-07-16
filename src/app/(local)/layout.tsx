"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Image as ImageIcon,
  Ban,
  Users,
  Wrench,
  LogOut,
  UserCircle,
  Menu,
  CreditCard,
  Crown,
} from "lucide-react";
import { Button } from "@/components/Button";
import { LogoMark } from "@/components/Logo";
import { PlanBadge, TrialCountdown } from "@/components/premium";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumStatusQuery } from "@/hooks/queries/usePremiumStatusQuery";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: "/local/dashboard", label: "Panel", icon: <LayoutDashboard className="size-5" /> },
  { to: "/local/calendar", label: "Turnos", icon: <CalendarDays className="size-5" /> },
  { to: "/local/schedules", label: "Horarios", icon: <CalendarDays className="size-5" /> },
  { to: "/local/employees", label: "Empleados", icon: <Users className="size-5" /> },
  { to: "/local/services", label: "Servicios", icon: <Wrench className="size-5" /> },
  { to: "/local/blockings", label: "Bloqueos", icon: <Ban className="size-5" /> },
  { to: "/local/images", label: "Fotos", icon: <ImageIcon className="size-5" /> },
  { to: "/local/payment-methods", label: "Metodos de cobro", icon: <CreditCard className="size-5" /> },
  { to: "/local/premium", label: "Planes", icon: <Crown className="size-5" /> },
  {
    to: "/local/profile",
    label: "Perfil",
    icon: <UserCircle className="size-5" />,
  },
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

  function handleLogout() {
    logout();
  }

  // El wizard de onboarding no usa la sidebar. Lo renderizamos como una
  // pantalla centrada, limpia, para que el foco este en los pasos.
  const isOnboarding = pathname?.startsWith("/local/onboarding") ?? false;

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
        <Link href="/local/dashboard" className="flex items-center gap-2 mb-4">
          <LogoMark />
        </Link>
        <p className="text-xs text-muted-foreground max-w-[18rem]">
          Panel de administracion del local
        </p>
      </div>

      <nav className="grid gap-1.5">
        {navItems.map((item) => (
          <Link
            key={item.to}
            className={navLinkClass(item.to)}
            href={item.to}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-3">
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-[0.7rem] text-muted-foreground uppercase tracking-wider mb-1">
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
        </div>
        {premiumStatus?.status === "trial" && premiumStatus.trialEndDate && (
          <TrialCountdown trialEndDate={premiumStatus.trialEndDate} />
        )}
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
      {navItems.map((item) => (
        <Link
          key={item.to}
          className={navLinkClass(item.to)}
          href={item.to}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div
      className={
        isOnboarding
          ? "min-h-screen p-5 max-sm:p-3"
          : "grid grid-cols-[280px_1fr] gap-5 min-h-screen p-5 max-lg:grid-cols-1 max-sm:gap-3 max-sm:p-3"
      }
    >
      {!isOnboarding && sidebar}

      <main
        className={
          isOnboarding
            ? "grid place-items-center"
            : "p-6 bg-card border border-border shadow-sm rounded-xl overflow-y-auto max-sm:order-2 max-sm:p-4 max-sm:rounded-xl"
        }
      >
        {!isOnboarding && (
          <div className="hidden max-sm:flex items-center justify-between gap-3 pb-4">
            <Link href="/local/dashboard" className="flex items-center gap-2">
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
                      <p className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
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
                    </div>
                    {premiumStatus?.status === "trial" && premiumStatus.trialEndDate && (
                      <TrialCountdown trialEndDate={premiumStatus.trialEndDate} />
                    )}
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
        )}

        {children}
      </main>
    </div>
  );
}
