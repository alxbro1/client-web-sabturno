"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import {
  usePremiumPlansQuery,
  FALLBACK_PLANS,
} from "@/hooks/queries/usePremiumPlansQuery";
import { usePremiumStatusQuery } from "@/hooks/queries/usePremiumStatusQuery";
import { premiumService } from "@/services/premium";
import { useOnboardingStore } from "@/stores/onboarding";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { PricingCard } from "@/components/premium";
import type { PlanInterval } from "@/lib/types/premium";

/**
 * Step 2 del wizard: elegir plan.
 *
 * - El backend ya inicializa un TRIAL de 30 dias en el register
 *   (ver `backend/src/auth/auth.service.ts:148-151`). El plan "BASIC" viene
 *   activo por default.
 * - Esta pantalla permite upgrade a PRO / ENTERPRISE via MercadoPago.
 * - Si el usuario no quiere elegir ahora, "Saltar" mantiene BASIC + TRIAL
 *   y avanza al step 3.
 */
export default function OnboardingSubscriptionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setSelectedPlan } = useOnboardingStore();
  const { user } = useAuthStore();
  const [interval, setInterval] = useState<PlanInterval>("monthly");
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  const { data: plans } = usePremiumPlansQuery();
  const { data: status, isLoading: statusLoading } = usePremiumStatusQuery();

  const displayPlans = plans ?? FALLBACK_PLANS;

  async function handleSelectPlan(planId: string) {
    if (status?.currentPlanId === planId) return;

    setSubscribingPlanId(planId);
    try {
      const result = await premiumService.subscribe({
        plan: planId.toUpperCase() as "BASIC" | "PRO" | "ENTERPRISE",
        interval,
      });

      const selectedTier = displayPlans.find((p) => p.id === planId)?.tier ?? null;
      setSelectedPlan(selectedTier);

      if (result.checkoutUrl) {
        // Redirige a MercadoPago. Cuando vuelva, el status se actualizara.
        queryClient.invalidateQueries({ queryKey: queryKeys.premiumStatus() });
        window.location.href = result.checkoutUrl;
        return;
      }

      // Plan gratuito o sin checkout
      toast.success("Plan activado correctamente");
      queryClient.invalidateQueries({ queryKey: queryKeys.premiumStatus() });
      router.push("/local/onboarding/hours");
    } catch (error) {
      console.error("Error al suscribirse:", error);
      toast.error("No se pudo procesar la suscripcion. Intenta de nuevo.");
    } finally {
      setSubscribingPlanId(null);
    }
  }

  function handleSkip() {
    setSelectedPlan(null);
    router.push("/local/onboarding/hours");
  }

  if (statusLoading) {
    return (
      <div className="min-h-[400px] grid place-items-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <section className="grid gap-8 max-w-5xl mx-auto">
      <header className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Paso 2 de 3
        </p>
        <h2 className="text-2xl font-bold text-foreground mt-1">
          Elegi tu plan
        </h2>
        <p className="text-muted-foreground mt-2">
          Tu local ya esta en trial gratuito (30 dias). Podes mantenerlo o
          upgrade ahora para desbloquear mas funcionalidades.
        </p>
      </header>

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted border border-border">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
              interval === "monthly"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer relative",
              interval === "yearly"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Anual
            <span className="ml-1.5 text-xs text-primary font-semibold">
              -17%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            interval={interval}
            isCurrentPlan={status?.currentPlanId === plan.id}
            onSelect={handleSelectPlan}
            isLoading={subscribingPlanId === plan.id}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={handleSkip}>
          Mantener BASIC (trial) y continuar
          <ArrowRight className="size-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Logueado como {user?.email}
        </p>
      </div>
    </section>
  );
}
