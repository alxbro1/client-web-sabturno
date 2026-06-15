"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export default function HomePage() {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    if (user) {
      router.replace(user.isLocal ? "/local/dashboard" : "/home");
    } else {
      router.replace("/login");
    }
  }, [hasHydrated, user, router]);

  return (
    <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
      Cargando...
    </div>
  );
}
