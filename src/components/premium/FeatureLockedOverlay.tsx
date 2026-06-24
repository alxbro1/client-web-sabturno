"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

interface FeatureLockedOverlayProps {
  /** Texto descriptivo del feature bloqueado */
  featureName: string;
  /** Tier mínimo requerido */
  requiredTier: "pro" | "enterprise";
  /** Si debe mostrar como inline (dentro de un card) o como overlay completo */
  variant?: "inline" | "overlay";
  className?: string;
}

const tierLabels: Record<string, string> = {
  pro: "Pro",
  enterprise: "Enterprise",
};

export function FeatureLockedOverlay({
  featureName,
  requiredTier,
  variant = "overlay",
  className,
}: FeatureLockedOverlayProps) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{featureName}</p>
            <p className="text-xs text-muted-foreground">
              Disponible en {tierLabels[requiredTier]}
            </p>
          </div>
        </div>
        <Link href="/local/premium">
          <Button variant="secondary">Upgrade</Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-border bg-card/80 backdrop-blur-sm text-center min-h-[200px]",
        className,
      )}
    >
      <div className="flex items-center justify-center size-14 rounded-full bg-muted">
        <Lock className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {featureName}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Esta funcionalidad está disponible en el plan{" "}
          <span className="font-medium text-foreground">
            {tierLabels[requiredTier]}
          </span>
          . Upgrade para desbloquearla.
        </p>
      </div>
      <Link href="/local/premium">
        <Button>Ver planes</Button>
      </Link>
    </div>
  );
}
