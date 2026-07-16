"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    if (user) {
      router.replace(user.isLocal ? "/local/dashboard" : "/home");
    } else {
      router.replace("/home");
    }
  }, [hasHydrated, user, router]);

  return (
    <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
      Cargando...
    </div>
  );
}
