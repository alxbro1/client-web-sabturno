"use client";

/**
 * `PaymentMethodCard` — tile seleccionable para un método de cobro.
 *
 * Equivalente web del `MethodItem` del mobile
 * (`app/src/features/profile/screens/ReceiptMethods.tsx:37-58`).
 *
 * Renderiza un `<button>` clickable con:
 *   - ícono/imagen a la izquierda,
 *   - título + descripción,
 *   - borde neon + fondo con gradient cuando `selected`,
 *   - badge de check (esquina superior derecha) cuando `selected`,
 *   - `rightContent` opcional (e.g. indicador de estado de Talo).
 *
 * Estilo coherente con los tiles de `app/booking/payment/page.tsx:200-244`.
 */
import type { ReactNode } from "react";

interface PaymentMethodCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  /** Slot derecho opcional (e.g. TaloStatusIndicator). */
  rightContent?: ReactNode;
  /** Texto opcional para `aria-label` (default = `title`). */
  ariaLabel?: string;
}

export function PaymentMethodCard({
  title,
  description,
  selected,
  onClick,
  icon,
  rightContent,
  ariaLabel,
}: PaymentMethodCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel ?? title}
      onClick={onClick}
      className={`relative w-full rounded-[28px] p-5 flex items-center gap-4 cursor-pointer text-left transition-[transform,border-color,background-color,box-shadow] duration-[140ms] ${
        selected
          ? "border border-[#00f068]/70 bg-[radial-gradient(circle_at_0%_0%,rgba(0,240,104,0.14),transparent_60%),linear-gradient(180deg,rgba(22,22,22,0.98),rgba(12,12,12,0.96))] shadow-[0_0_0_1px_rgba(0,240,104,0.22),0_20px_50px_rgba(0,240,104,0.08)]"
          : "border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] hover:-translate-y-0.5 hover:border-[#00f068]/45"
      }`}
    >
      {selected ? (
        <span className="absolute top-4 right-4 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#00f068]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#07150d"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : null}

      {icon ? (
        <div className="h-10 w-10 shrink-0 flex items-center justify-center">
          {icon}
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <h3 className={selected ? "text-[#00f068]" : "text-white"}>{title}</h3>
        {description ? <p className="mt-1">{description}</p> : null}
      </div>

      {rightContent ? (
        <div className="shrink-0 flex items-center gap-2">{rightContent}</div>
      ) : null}
    </button>
  );
}
