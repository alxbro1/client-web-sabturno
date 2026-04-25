import type { PropsWithChildren } from "react";

type StatCardProps = PropsWithChildren<{
  title: string;
  value: string | number;
}>;

export function StatCard({ title, value, children }: StatCardProps) {
  return (
      <article className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 min-h-[140px] transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#00f068]/38">
        <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">{title}</span>
        <strong className="block mt-2 text-[1.7rem] text-white">{value}</strong>
      {children}
    </article>
  );
}