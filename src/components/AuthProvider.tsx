"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setHydrated } = useAuthStore();

  useEffect(() => {
    // The auth store is persisted in localStorage via Zustand persist.
    // It will automatically load the user and token from localStorage.
    // We just need to set hasHydrated to true to signal that hydration is complete.
    setHydrated(true);
  }, [setHydrated]);

  return <>{children}</>;
}
