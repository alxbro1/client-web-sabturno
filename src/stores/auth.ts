import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/lib/types/auth";
import { browserStorage } from "@/lib/storage";

type AuthState = {
  user: User | null;
  token: string | null;
  hasHydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => void;
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
    }),
    {
      name: "sabturno-client-auth",
      storage: createJSONStorage(() => browserStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);

useAuthStore.persist.onHydrate(() => {
  useAuthStore.setState({ hasHydrated: false });
});

if (useAuthStore.persist.hasHydrated()) {
  useAuthStore.setState({ hasHydrated: true });
}

useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.setState({ hasHydrated: true });
});

void useAuthStore.persist.rehydrate();