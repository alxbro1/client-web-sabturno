import { create } from "zustand";
import type { PlanTier } from "@/lib/types/premium";

export type OnboardingStep = "logo" | "subscription" | "hours" | "done";

interface OnboardingState {
  /** Paso actual del wizard. Se persiste en el backend via queries, pero
   *  este campo permite que la UI recuerde entre navegaciones del cliente. */
  step: OnboardingStep;
  hasLogo: boolean;
  /** null = no eligio plan (mantiene TRIAL por default). */
  selectedPlan: PlanTier | null;
  hasSchedule: boolean;
  setStep: (step: OnboardingStep) => void;
  setHasLogo: (value: boolean) => void;
  setSelectedPlan: (plan: PlanTier | null) => void;
  setHasSchedule: (value: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: "logo",
  hasLogo: false,
  selectedPlan: null,
  hasSchedule: false,
  setStep: (step) => set({ step }),
  setHasLogo: (hasLogo) => set({ hasLogo }),
  setSelectedPlan: (selectedPlan) => set({ selectedPlan }),
  setHasSchedule: (hasSchedule) => set({ hasSchedule }),
  reset: () =>
    set({
      step: "logo",
      hasLogo: false,
      selectedPlan: null,
      hasSchedule: false,
    }),
}));
