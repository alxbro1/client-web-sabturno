import type { PropsWithChildren } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type StatCardProps = PropsWithChildren<{
  title: string;
  value: string | number;
}>;

/**
 * @deprecated No se usa actualmente. Migrada a shadcn Card para consistencia.
 */
export function StatCard({ title, value, children }: StatCardProps) {
  return (
    <Card className="transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#00f068]/38">
      <CardHeader className="pb-2">
        <CardDescription className="text-[0.78rem] uppercase tracking-[0.08em]">
          {title}
        </CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
