"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrialCountdownProps {
  trialEndDate: string | null;
  className?: string;
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function TrialCountdown({ trialEndDate, className }: TrialCountdownProps) {
  if (!trialEndDate) return null;

  const daysLeft = getDaysRemaining(trialEndDate);

  if (daysLeft <= 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm font-medium",
          className,
        )}
      >
        <Clock className="size-4" />
        <span>Trial finalizado</span>
      </div>
    );
  }

  const isUrgent = daysLeft <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium",
        isUrgent
          ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
          : "bg-primary/10 border-primary/25 text-primary",
        className,
      )}
    >
      <Clock className="size-4" />
      <span>
        {daysLeft === 1
          ? "Último día de trial"
          : `${daysLeft} días de trial restantes`}
      </span>
    </div>
  );
}
