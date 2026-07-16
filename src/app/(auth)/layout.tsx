"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated || !user) return;
    router.replace(user.isLocal ? "/local/dashboard" : "/home");
  }, [hasHydrated, user, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-muted-foreground">
        Cargando...
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen grid place-items-center text-center text-muted-foreground">
        Redirigiendo...
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-8 max-sm:p-4 bg-gradient-to-b from-primary/[0.04] to-transparent">
      {children}
    </div>
  );
}
