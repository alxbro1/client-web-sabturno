import Link from "next/link";
import { cn } from "@/lib/utils";

type LocalNavCardProps = {
  to: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
};

export function LocalNavCard({
  to,
  title,
  description,
  icon,
}: LocalNavCardProps) {
  return (
    <Link
      href={to}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground shadow-sm",
        "transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#00f068]/45",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 grid gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
            {title}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </Link>
  );
}
