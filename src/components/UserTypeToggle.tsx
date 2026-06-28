"use client";

import { useClientTypeStore } from "@/stores/clientType";
import { cn } from "@/lib/utils";

/**
 * Segmented control CLIENTE / LOCAL inspirado en el patron del registro
 * de la app movil (`app/src/features/auth/screens/RegisterScreen.tsx:70-99`).
 *
 * - Sin acentos en el copy (mismo estilo que el resto de la web).
 * - Estado controlado por el store efimero `useClientTypeStore`.
 * - 100% presentacional: el padre no necesita pasar props; lee/escribe
 *   directamente del store. Mantener el componente tonto lo hace facil
 *   de reusar y testear.
 */
export function UserTypeToggle({ className }: { className?: string }) {
  const { isBusiness, setIsBusiness } = useClientTypeStore();

  return (
    <div
      role="tablist"
      aria-label="Tipo de cuenta"
      className={cn(
        "flex flex-row rounded-full bg-card p-1.5 mb-6 border border-white/10",
        className,
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={!isBusiness}
        onClick={() => setIsBusiness(false)}
        className={cn(
          "flex-1 rounded-full py-2 text-sm font-semibold transition-colors cursor-pointer",
          !isBusiness ? "bg-[#00f068] text-[#07090B]" : "text-muted-foreground hover:text-foreground",
        )}
      >
        CLIENTE
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={isBusiness}
        onClick={() => setIsBusiness(true)}
        className={cn(
          "flex-1 rounded-full py-2 text-sm font-semibold transition-colors cursor-pointer",
          isBusiness ? "bg-[#00f068] text-[#07090B]" : "text-muted-foreground hover:text-foreground",
        )}
      >
        LOCAL
      </button>
    </div>
  );
}
