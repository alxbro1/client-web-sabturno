"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  PricingCard,
  PricingComparison,
} from "@/components/premium";
import { usePremiumPlansQuery, FALLBACK_PLANS } from "@/hooks/queries/usePremiumPlansQuery";
import { usePremiumStatusQuery } from "@/hooks/queries/usePremiumStatusQuery";
import { premiumService } from "@/services/premium";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import type { PlanInterval } from "@/lib/types/premium";

export default function PremiumPage() {
  const router = useRouter();
  const { hasHydrated, user } = useAuthStore();
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
        planId,
        interval,
      });

      if (result.checkoutUrl) {
        // Redirigir a MercadoPago
        window.location.href = result.checkoutUrl;
      } else {
        // Plan gratuito o sin checkout
        toast.success("¡Plan activado correctamente!");
        router.push("/local/premium/success");
      }
    } catch (error) {
      console.error("Error al suscribirse:", error);
      toast.error("No se pudo procesar la suscripción. Intentá de nuevo.");
    } finally {
      setSubscribingPlanId(null);
    }
  }

  if (!hasHydrated || statusLoading) {
    return (
      <div className="min-h-[400px] grid place-items-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user?.isLocal) {
    return (
      <div className="min-h-[400px] grid place-items-center text-center">
        <p className="text-muted-foreground">
          Solo los propietarios de locales pueden acceder a los planes premium.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-10">
      <header className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
          Planes
        </p>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Elegí el plan ideal para tu negocio
        </h1>
        <p className="text-muted-foreground">
          Todos los planes incluyen MercadoPago y Talo. Elegí según las
          funcionalidades que necesitás.
        </p>
      </header>

      {/* Toggle mensual / anual */}
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

      {/* Cards de planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
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

      {/* Tabla comparativa */}
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          Comparación de features
        </h2>
        <PricingComparison
          plans={displayPlans}
          currentTier={status?.tier}
        />
      </div>

      {/* Link a gestión si ya tiene suscripción */}
      {status && status.tier !== "basic" && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tenés una suscripción?{" "}
            <button
              type="button"
              onClick={() => router.push("/local/premium/manage")}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Gestionar suscripción
            </button>
          </p>
        </div>
      )}
    </section>
  );
}
