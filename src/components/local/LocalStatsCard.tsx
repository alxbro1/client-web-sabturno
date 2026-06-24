import type { PropsWithChildren } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";

type LocalStatsCardProps = PropsWithChildren<{
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
}>;

export function LocalStatsCard({
  title,
  value,
  icon,
  trend,
  children,
}: LocalStatsCardProps) {
  return (
    <Card className="transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#00f068]/38">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <CardDescription className="text-[0.78rem] uppercase tracking-[0.08em]">
              {title}
            </CardDescription>
            <CardTitle className="text-3xl">{value}</CardTitle>
          </div>
          {icon && <CardAction>{icon}</CardAction>}
        </div>
      </CardHeader>

      {(trend || children) && (
        <CardContent className="flex items-center gap-2">
          {trend && (
            <span
              className={`text-sm font-medium ${trend.positive ? "text-emerald-400" : "text-rose-400"}`}
            >
              {trend.positive ? "+" : ""}
              {trend.value}%
            </span>
          )}
          {children}
        </CardContent>
      )}
    </Card>
  );
}
