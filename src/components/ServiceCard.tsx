import { memo } from "react";
import { formatCurrency } from "@/lib/utils/date";
import type { Service } from "@/lib/types/booking";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

export const ServiceCard = memo(function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className="w-full h-24 max-w-full overflow-hidden flex items-center gap-4 p-3 rounded-[20px] border border-white/12 bg-gradient-to-b from-[rgba(22,22,22,0.96)] to-[rgba(12,12,12,0.95)] backdrop-blur-[12px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] transition-all duration-[140ms] hover:border-[#00f068]/45 hover:shadow-[0_20px_50px_rgba(0,240,104,0.1)] active:scale-95 group text-left"
    >
      <div className="flex-shrink-0">
        <div className="w-15 h-15 rounded-[16px] bg-gradient-to-br from-[#00f068]/22 to-[#00f068]/8 border border-[#00f068]/30 flex items-center justify-center text-[#00f068]">
          <span className="text-xl font-semibold">{service.name.charAt(0).toUpperCase()}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#00f068] truncate mb-0.5">{service.category}</p>
        <h3 className="font-semibold text-white truncate mb-0.5">{service.name}</h3>
        <p className="text-xs text-white/52 mb-2 break-words overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
          {service.description || "Sin descripcion disponible."}
        </p>

        <div className="flex gap-1.5 flex-wrap">
          <span className="inline-block px-2 py-0.5 mt-0.5 text-[0.65rem] font-medium text-white/70 bg-white/6 border border-white/10 rounded-full whitespace-nowrap">
            {service.duration} min
          </span>
          <span className="inline-block px-2 py-0.5 mt-0.5 text-[0.65rem] font-semibold text-[#00f068] bg-[#00f068]/10 border border-[#00f068]/35 rounded-full whitespace-nowrap">
            {formatCurrency(service.cost)}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 text-white/30 group-hover:text-[#00f068] group-hover:translate-x-1 transition-all duration-[140ms] text-xl">
        ›
      </div>
    </button>
  );
});
