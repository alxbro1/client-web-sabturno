"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setHydrated } = useAuthStore();

  useEffect(() => {
    async function hydrateAuth() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          useAuthStore.getState().login(data.user, data.token);
        }
      } catch {
        // Not authenticated - that's okay
      } finally {
        setHydrated(true);
      }
    }

    hydrateAuth();
  }, [setHydrated]);

  return <>{children}</>;
}
