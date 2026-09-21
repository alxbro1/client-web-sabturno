import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/date";
import type { Service } from "@/lib/types/booking";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

export const ServiceCard = memo(function ServiceCard({
  service,
  onSelect,
}: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className="group flex min-h-24 w-full items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all duration-[140ms] outline-none hover:border-primary/45 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95"
    >
      {/* Icono — inicial del servicio */}
      <div className="flex-shrink-0">
        <div className="flex h-15 w-15 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <span className="text-xl font-semibold">
            {service.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 truncate text-xs font-semibold text-primary">
          {service.category}
        </p>
        <h3 className="mb-0.5 truncate font-semibold text-foreground">
          {service.name}
        </h3>
        <p className="mb-2 overflow-hidden text-ellipsis text-xs text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {service.description || "Sin descripción disponible."}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span className="mt-0.5 inline-block whitespace-nowrap rounded-full border bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            {service.duration} min
          </span>
          <span className="mt-0.5 inline-block whitespace-nowrap rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
            {formatCurrency(service.cost)}
          </span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground transition-transform duration-[140ms] group-hover:translate-x-1 group-hover:text-primary"
      />
    </button>
  );
});
