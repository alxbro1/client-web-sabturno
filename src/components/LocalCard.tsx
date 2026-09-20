import { memo } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import type { Local } from "@/lib/types/local";

interface LocalCardProps {
  local: Local;
  onSelect: (local: Local) => void;
}

export const LocalCard = memo(function LocalCard({
  local,
  onSelect,
}: LocalCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(local)}
      className="group flex h-24 w-full items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all duration-[140ms] outline-none hover:border-primary/45 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95"
    >
      {/* Avatar / imagen del local */}
      <div className="flex-shrink-0">
        <div className="flex h-15 w-15 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
          {local.imageProfile ? (
            <img
              src={local.imageProfile}
              alt={local.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary/60">
              <span className="text-xl font-semibold">
                {local.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1 text-left">
        <h3 className="mb-0.5 truncate font-semibold text-foreground">
          {local.name}
        </h3>

        <div className="mb-2 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {local.city}
            {local.province ? `, ${local.province}` : ""}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {local.mercadoPagoLiveMode && (
            <span className="mt-0.5 inline-block whitespace-nowrap rounded-full border bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
              Mercado Pago
            </span>
          )}
          {local.payWithCashInFront && (
            <span className="mt-0.5 inline-block whitespace-nowrap rounded-full border bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
              Efectivo
            </span>
          )}
          {local.payWithReservation && (
            <span className="mt-0.5 inline-block whitespace-nowrap rounded-full border bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
              Seña
            </span>
          )}
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
