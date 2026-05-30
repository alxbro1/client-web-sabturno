import { Link } from "react-router-dom";

type LocalNavCardProps = {
  to: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
};

export function LocalNavCard({ to, title, description, icon }: LocalNavCardProps) {
  return (
    <Link
      to={to}
      className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068] mb-1">{title}</p>
          <p className="text-white/70 text-sm leading-relaxed">{description}</p>
        </div>
        {icon && <div className="text-white/40">{icon}</div>}
      </div>
    </Link>
  );
}