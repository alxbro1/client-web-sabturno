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
 *   - borde neon + fondo cuando `selected`,
 *   - badge de check (esquina superior derecha) cuando `selected`,
 *   - `rightContent` opcional (e.g. indicador de estado de Talo).
 */
import type { ReactNode } from "react";
import { Check } from "lucide-react";

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
  /** Si está deshabilitado, no se puede hacer click. */
  disabled?: boolean;
}

export function PaymentMethodCard({
  title,
  description,
  selected,
  onClick,
  icon,
  rightContent,
  ariaLabel,
  disabled,
}: PaymentMethodCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel ?? title}
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full rounded-xl p-5 flex items-center gap-4 text-left transition-all duration-[140ms] ${
        disabled
          ? "border border-border bg-card/50 opacity-60 cursor-not-allowed"
          : selected
            ? "border-2 border-primary/60 bg-primary/[0.06] shadow-sm cursor-pointer"
            : "border border-border bg-card shadow-sm hover:-translate-y-0.5 hover:border-primary/40 cursor-pointer"
      }`}
    >
      {selected ? (
        <span className="absolute top-4 right-4 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
        </span>
      ) : null}

      {icon ? (
        <div className="h-10 w-10 shrink-0 flex items-center justify-center">
          {icon}
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {rightContent ? (
        <div className="shrink-0 flex items-center gap-2">{rightContent}</div>
      ) : null}
    </button>
  );
}
