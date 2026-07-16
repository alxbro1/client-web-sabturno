import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/lib/types/auth";
import { browserStorage } from "@/lib/storage";

type AuthState = {
  user: User | null;
  token: string | null;
  hasHydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hasHydrated: false,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      updateUserProfile: (data) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },
      setHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "sabturno-client-auth",
      storage: createJSONStorage(() => browserStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error) {
            state?.setHydrated(true);
          }
        };
      },
    },
  ),
);
