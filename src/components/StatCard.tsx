import type { PropsWithChildren } from "react";

type StatCardProps = PropsWithChildren<{
  title: string;
  value: string | number;
}>;

export function StatCard({ title, value, children }: StatCardProps) {
  return (
      <article className="surface min-h-[140px]">
        <span className="meta-label">{title}</span>
        <strong className="block mt-2 text-[1.7rem]">{value}</strong>
      {children}
    </article>
  );
}