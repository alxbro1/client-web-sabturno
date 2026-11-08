import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingStep = "logo" | "subscription" | "hours" | "done";

interface OnboardingState {
  /** Paso actual del wizard. Se persiste en el backend via queries, pero
   *  este campo permite que la UI recuerde entre navegaciones del cliente. */
  step: OnboardingStep;
  hasLogo: boolean;
  hasSchedule: boolean;
  /** true = el usuario completo o salto el onboarding. No volver a redirigir. */
  dismissed: boolean;
  setStep: (step: OnboardingStep) => void;
  setHasLogo: (value: boolean) => void;
  setHasSchedule: (value: boolean) => void;
  dismiss: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: "logo",
      hasLogo: false,
      hasSchedule: false,
      dismissed: false,
      setStep: (step) => set({ step }),
      setHasLogo: (hasLogo) => set({ hasLogo }),
      setHasSchedule: (hasSchedule) => set({ hasSchedule }),
      dismiss: () => set({ dismissed: true }),
      reset: () =>
        set({
          step: "logo",
          hasLogo: false,
          hasSchedule: false,
          dismissed: false,
        }),
    }),
    { name: "sabturno-onboarding" },
  ),
);
