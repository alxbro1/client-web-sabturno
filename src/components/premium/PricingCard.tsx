"use client";

import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";
import type { PremiumPlan, PlanInterval } from "@/lib/types/premium";

interface PricingCardProps {
  plan: PremiumPlan;
  interval: PlanInterval;
  isCurrentPlan: boolean;
  onSelect: (planId: string) => void;
  isLoading?: boolean;
  className?: string;
}

function formatPrice(amount: number): string {
  if (amount === 0) return "Gratis";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function FeatureItem({ included, label }: { included: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      {included ? (
        <Check className="size-4 text-primary shrink-0 mt-0.5" />
      ) : (
        <X className="size-4 text-muted-foreground/50 shrink-0 mt-0.5" />
      )}
      <span
        className={cn(
          "text-sm",
          included ? "text-foreground" : "text-muted-foreground/60",
        )}
      >
        {label}
      </span>
    </li>
  );
}

export function PricingCard({
  plan,
  interval,
  isCurrentPlan,
  onSelect,
  isLoading,
  className,
}: PricingCardProps) {
  const price = interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const monthlyEquivalent =
    interval === "yearly" && plan.yearlyPrice > 0
      ? Math.round(plan.yearlyPrice / 12)
      : null;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-6 transition-all duration-200",
        plan.isPopular
          ? "border-primary/50 shadow-[0_0_30px_rgba(0,240,104,0.1)]"
          : "border-border hover:border-border/80",
        className,
      )}
    >
      {plan.isPopular && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-3 py-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            <Sparkles className="size-3.5" />
            Más popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground text-sm">
              /{interval === "monthly" ? "mes" : "año"}
            </span>
          )}
        </div>
        {monthlyEquivalent !== null && price > 0 && (
          <p className="text-sm text-primary mt-1">
            {formatPrice(monthlyEquivalent)}/mes — ¡2 meses gratis!
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        <FeatureItem included={plan.features.mercadopago} label="MercadoPago" />
        <FeatureItem included={plan.features.talo} label="Talo (transferencias)" />
        <FeatureItem
          included={plan.features.cashTurnsLimit !== 0}
          label={
            plan.features.cashTurnsLimit === null
              ? "Efectivo ilimitado"
              : plan.features.cashTurnsLimit === 0
                ? "Efectivo no disponible"
                : `Efectivo (${plan.features.cashTurnsLimit}/mes)`
          }
        />
        <FeatureItem
          included={plan.features.loyalty}
          label="Fidelización de clientes"
        />
        <FeatureItem
          included={plan.features.prioritySupport}
          label="Soporte prioritario"
        />
        <FeatureItem
          included={plan.features.advancedStats}
          label="Estadísticas avanzadas"
        />
        <FeatureItem
          included={plan.features.unlimitedEmployees}
          label="Empleados ilimitados"
        />
      </ul>

      <Button
        fullWidth
        variant={plan.isPopular ? "primary" : isCurrentPlan ? "secondary" : "secondary"}
        onClick={() => onSelect(plan.id)}
        disabled={isCurrentPlan || isLoading}
        className={cn(
          isCurrentPlan && "cursor-default opacity-70",
        )}
      >
        {isLoading
          ? "Procesando..."
          : isCurrentPlan
            ? "Plan actual"
            : plan.tier === "basic"
              ? "Gratis"
              : "Elegir plan"}
      </Button>
    </div>
  );
}
