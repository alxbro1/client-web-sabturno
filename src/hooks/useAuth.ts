"use client";

import { useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import type { User } from "@/lib/types/auth";

export function useAuth() {
  const { data: session, status, update } = useSession();

  const user = useMemo<User | null>(() => {
    if (!session?.user) return null;
    return {
      id: String((session.user as any).id ?? ""),
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      isLocal: (session.user as any).isLocal ?? false,
      image: session.user.image ?? null,
      phone: (session.user as any).phone ?? null,
      localName: (session.user as any).localName ?? null,
    } as User;
  }, [session?.user]);

  return {
    user,
    token: (session as any)?.accessToken ?? null,
    hasHydrated: status !== "loading",
    isLoading: status === "loading",
    logout: () => signOut(),
    updateUserProfile: async (data: Record<string, unknown>) => {
      await update({ ...session, user: { ...session?.user, ...data } });
    },
  };
}
