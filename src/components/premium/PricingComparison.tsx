"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PremiumPlan, PlanTier } from "@/lib/types/premium";

interface PricingComparisonProps {
  plans: PremiumPlan[];
  currentTier?: PlanTier;
  className?: string;
}

interface ComparisonRow {
  label: string;
  basic: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const comparisonRows: ComparisonRow[] = [
  { label: "MercadoPago", basic: true, pro: true, enterprise: true },
  { label: "Talo (transferencias)", basic: true, pro: true, enterprise: true },
  { label: "Efectivo", basic: "No disponible", pro: "500/mes", enterprise: "Ilimitado" },
  { label: "Fidelización", basic: false, pro: false, enterprise: true },
  { label: "Soporte prioritario", basic: false, pro: true, enterprise: true },
  { label: "Estadísticas avanzadas", basic: false, pro: true, enterprise: true },
  { label: "Empleados ilimitados", basic: false, pro: false, enterprise: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="size-5 text-primary mx-auto" />
  ) : (
    <X className="size-5 text-muted-foreground/40 mx-auto" />
  );
}

export function PricingComparison({
  plans,
  currentTier,
  className,
}: PricingComparisonProps) {
  const tierOrder: PlanTier[] = ["basic", "pro", "enterprise"];

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
              Feature
            </th>
            {tierOrder.map((tier) => {
              const plan = plans.find((p) => p.tier === tier);
              const isCurrent = currentTier === tier;
              return (
                <th
                  key={tier}
                  className={cn(
                    "py-4 px-4 text-center",
                    isCurrent && "bg-primary/5 rounded-t-lg",
                  )}
                >
                  <div className="text-sm font-bold text-foreground">
                    {plan?.name ?? tier}
                  </div>
                  {isCurrent && (
                    <span className="text-xs text-primary font-medium">
                      Plan actual
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {comparisonRows.map((row, i) => (
            <tr
              key={row.label}
              className={cn(
                "border-b border-border/50",
                i % 2 === 0 && "bg-muted/20",
              )}
            >
              <td className="py-3.5 px-4 text-sm text-muted-foreground">
                {row.label}
              </td>
              {tierOrder.map((tier) => {
                const isCurrent = currentTier === tier;
                return (
                  <td
                    key={tier}
                    className={cn(
                      "py-3.5 px-4 text-center",
                      isCurrent && "bg-primary/5",
                    )}
                  >
                    <CellValue value={row[tier]} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
