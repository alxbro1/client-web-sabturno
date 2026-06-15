"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && user && !user.isLocal) {
      router.replace("/home");
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
        Cargando...
      </div>
    );
  }

  if (user && !user.isLocal) {
    return null;
  }

  return (
    <div className="min-h-screen grid place-items-center p-8 max-sm:p-4 bg-[radial-gradient(circle_at_top,rgba(0,240,104,0.05),transparent_38%)]">
      {children}
    </div>
  );
}
