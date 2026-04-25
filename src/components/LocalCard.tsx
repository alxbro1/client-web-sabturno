import { memo } from "react";
import type { Local } from "@/lib/types/local";

interface LocalCardProps {
  local: Local;
  onSelect: (local: Local) => void;
}

export const LocalCard = memo(function LocalCard({ local, onSelect }: LocalCardProps) {
  return (
    <button
      onClick={() => onSelect(local)}
      className="w-full flex items-center gap-4 p-3 rounded-[20px] border border-white/12 bg-gradient-to-b from-[rgba(22,22,22,0.96)] to-[rgba(12,12,12,0.95)] backdrop-blur-[12px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] transition-all duration-[140ms] hover:border-[#00f068]/45 hover:shadow-[0_20px_50px_rgba(0,240,104,0.1)] active:scale-95 group text-left"
    >
      <div className="flex-shrink-0">
        <div className="w-15 h-15 rounded-[16px] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
          {local.imageProfile ? (
            <img
              src={local.imageProfile}
              alt={local.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#00f068]/20 to-[#00f068]/5 flex items-center justify-center text-[#00f068]/60">
              <span className="text-xl font-semibold">{local.name.charAt(0)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 text-left min-w-0">
        <h3 className="font-semibold text-white truncate mb-0.5">{local.name}</h3>
        
        <p className="text-xs text-white/50 truncate mb-2">
          {local.city}
          {local.province ? `, ${local.province}` : ""}
        </p>

        <div className="flex gap-1.5 flex-wrap">
          {local.mercadoPagoLiveMode && (
            <span className="inline-block px-2 py-0.5 mt-0.5 text-[0.65rem] font-medium text-white/70 bg-white/6 border border-white/10 rounded-full whitespace-nowrap">
              MP
            </span>
          )}
          {local.payWithCashInFront && (
            <span className="inline-block px-2 py-0.5 mt-0.5 text-[0.65rem] font-medium text-white/70 bg-white/6 border border-white/10 rounded-full whitespace-nowrap">
              Efectivo
            </span>
          )}
          {local.payWithReservation && (
            <span className="inline-block px-2 py-0.5 mt-0.5 text-[0.65rem] font-medium text-white/70 bg-white/6 border border-white/10 rounded-full whitespace-nowrap">
              Reserva
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-white/30 group-hover:text-[#00f068] group-hover:translate-x-1 transition-all duration-[140ms] text-xl">
        ›
      </div>
    </button>
  );
});
