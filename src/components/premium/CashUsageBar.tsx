"use client";

import { cn } from "@/lib/utils";

interface CashUsageBarProps {
  used: number;
  limit: number | null;
  className?: string;
}

export function CashUsageBar({ used, limit, className }: CashUsageBarProps) {
  // null = ilimitado (Enterprise)
  if (limit === null) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Turnos en efectivo</span>
          <span className="text-primary font-medium">Ilimitados</span>
        </div>
      </div>
    );
  }

  // 0 = no disponible (Básico)
  if (limit === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Turnos en efectivo</span>
          <span className="text-muted-foreground font-medium">No disponible</span>
        </div>
      </div>
    );
  }

  const percentage = Math.min(100, (used / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Turnos en efectivo este mes</span>
        <span
          className={cn(
            "font-medium",
            isAtLimit
              ? "text-destructive"
              : isNearLimit
                ? "text-amber-400"
                : "text-foreground",
          )}
        >
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isAtLimit
              ? "bg-destructive"
              : isNearLimit
                ? "bg-amber-400"
                : "bg-primary",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-xs text-destructive">
          Alcanzaste el límite. Upgrade a Enterprise para efectivo ilimitado.
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-amber-400">
          Te estás acercando al límite mensual.
        </p>
      )}
    </div>
  );
}
