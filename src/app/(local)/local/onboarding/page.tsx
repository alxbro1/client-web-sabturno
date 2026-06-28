"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/stores/auth";
import { useOnboardingStore, type OnboardingStep } from "@/stores/onboarding";
import { premiumService } from "@/services/premium";
import { scheduleService } from "@/features/local/services/schedule.service";

/**
 * Entry point del wizard de onboarding del local.
 *
 * - Detecta que datos faltan (logo, plan, horarios) consultando el backend.
 * - Redirige al primer step incompleto. Si esta todo completo -> /local/dashboard.
 * - Tambien expone un boton "Saltar al panel" para usuarios que no quieren
 *   configurar nada todavia (completable desde /local/profile despues).
 */
export default function OnboardingEntryPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const { setStep, reset: resetOnboarding } = useOnboardingStore();

  const localId = user?.id ?? "";

  const statusQuery = useQuery({
    queryKey: ["onboarding", "premium-status", localId],
    queryFn: () => premiumService.getStatus(),
    enabled: hasHydrated && !!user?.isLocal,
    retry: 0,
  });

  const templatesQuery = useQuery({
    queryKey: ["onboarding", "schedule-templates", localId],
    queryFn: () => scheduleService.getTemplates(localId),
    enabled: hasHydrated && !!user?.isLocal && !!localId,
    retry: 0,
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.isLocal) {
      router.replace("/home");
      return;
    }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (!hasHydrated || !user?.isLocal) return;
    if (statusQuery.isLoading || templatesQuery.isLoading) return;

    const hasLogo = !!user.imageProfile;
    const hasPlan = !!statusQuery.data?.currentPlanId;
    const hasSchedule =
      !!templatesQuery.data && templatesQuery.data.length > 0;

    let nextStep: OnboardingStep = "done";
    if (!hasLogo) nextStep = "logo";
    else if (!hasPlan) nextStep = "subscription";
    else if (!hasSchedule) nextStep = "hours";

    if (nextStep === "done") {
      resetOnboarding();
      router.replace("/local/dashboard");
      return;
    }

    setStep(nextStep);
    router.replace(`/local/onboarding/${nextStep}`);
  }, [
    hasHydrated,
    user,
    statusQuery.isLoading,
    templatesQuery.isLoading,
    statusQuery.data,
    templatesQuery.data,
    router,
    setStep,
    resetOnboarding,
  ]);

  if (!hasHydrated || !user?.isLocal) {
    return (
      <div className="min-h-[400px] grid place-items-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  if (statusQuery.isError || templatesQuery.isError) {
    return (
      <div className="min-h-[400px] grid place-items-center text-center gap-3">
        <p className="text-muted-foreground">
          No pudimos cargar el estado de tu local. Intenta de nuevo.
        </p>
        <Button
          onClick={() => {
            statusQuery.refetch();
            templatesQuery.refetch();
          }}
        >
          Reintentar
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.replace("/local/dashboard")}
        >
          Ir al panel
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] grid place-items-center text-center gap-4">
      <Loader2 className="size-8 text-primary animate-spin" />
      <p className="text-muted-foreground">Preparando tu local...</p>
      <Button variant="ghost" onClick={() => router.replace("/local/dashboard")}>
        Saltar al panel
      </Button>
    </div>
  );
}
