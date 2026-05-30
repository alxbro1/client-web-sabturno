import type { PropsWithChildren } from "react";

type LocalStatsCardProps = PropsWithChildren<{
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
}>;

export function LocalStatsCard({ title, value, icon, trend, children }: LocalStatsCardProps) {
  return (
    <article className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 min-h-[140px] transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#00f068]/38 flex flex-col justify-between">
      <div>
        <span className="block text-[0.78rem] uppercase tracking-[0.08em] text-white/52">{title}</span>
        <strong className="block mt-2 text-[1.7rem] text-white">{value}</strong>
      </div>
      <div className="flex items-end justify-between">
        {trend && (
          <span className={`text-[0.8rem] ${trend.positive ? 'text-[#00f068]' : 'text-[#ff5678]'}`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
        {icon && <div className="text-white/30">{icon}</div>}
        {children}
      </div>
    </article>
  );
}