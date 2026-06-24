"use client";

import { Crown, Zap, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/lib/types/premium";

interface PlanBadgeProps {
  tier: PlanTier;
  className?: string;
  showIcon?: boolean;
}

const tierConfig: Record<
  PlanTier,
  { label: string; icon: typeof Crown; className: string }
> = {
  basic: {
    label: "Básico",
    icon: Zap,
    className:
      "bg-muted text-muted-foreground border-border",
  },
  pro: {
    label: "Pro",
    icon: Crown,
    className:
      "bg-primary/15 text-primary border-primary/30",
  },
  enterprise: {
    label: "Enterprise",
    icon: Building2,
    className:
      "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
};

export function PlanBadge({ tier, className, showIcon = true }: PlanBadgeProps) {
  const normalizedTier = tier.toLowerCase() as PlanTier;
  const config = tierConfig[normalizedTier] ?? tierConfig.basic;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2.5 py-1 text-xs font-semibold",
        config.className,
        className,
      )}
    >
      {showIcon && <Icon className="size-3.5" />}
      {config.label}
    </Badge>
  );
}
