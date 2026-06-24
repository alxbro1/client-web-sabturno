import type { ButtonHTMLAttributes } from "react";
import { Button as ShadcnButton, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Wrapper retrocompatible sobre el Button de shadcn/ui.
 *
 * Mapea la API legacy (variant: primary | secondary | danger | ghost) a las
 * variants de shadcn para no tocar los 32 imports esparcidos por el proyecto.
 *
 * - `primary`  → `default`     (verde neón, brand color)
 * - `secondary`→ `secondary`   (gris)
 * - `danger`   → `destructive` (rojo)
 * - `ghost`    → `ghost`       (transparente, hover sutil)
 *
 * `fullWidth` se traduce a `w-full`.
 *
 * Si necesitás las variants nativas de shadcn (`outline`, `link`) o `size`,
 * importá directamente desde `@/components/ui/button`.
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const VARIANT_MAP: Record<ButtonVariant, "default" | "secondary" | "destructive" | "ghost"> = {
  primary: "default",
  secondary: "secondary",
  danger: "destructive",
  ghost: "ghost",
};

export function Button({
  children,
  className,
  variant = "primary",
  fullWidth = false,
  type,
  ...props
}: ButtonProps) {
  return (
    <ShadcnButton
      type={type ?? "button"}
      variant={VARIANT_MAP[variant]}
      className={cn(
        // Radios más generosos que el default de shadcn para mantener el
        // lenguaje visual del brand (ver :root --radius: 0.75rem).
        "rounded-xl px-5 py-2.5 font-semibold cursor-pointer",
        // Sutil lift en hover, igual al Button custom original.
        "hover:-translate-y-px transition-transform",
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}

// Re-export para quien quiera usar el Button shadcn nativo (variants outline,
// link, size, asChild, etc.) desde este mismo barrel.
export { ShadcnButton, buttonVariants };
export type { VariantProps } from "class-variance-authority";
