import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    fullWidth?: boolean;
  }
>;

const BASE =
  "border-0 rounded-2xl px-[1.15rem] py-[0.9rem] cursor-pointer transition-[opacity,transform] duration-[120ms] ease-in-out hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45";

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "text-[#0a0a0a] bg-[#00f068] hover:bg-[#33f38a]",
  secondary: "text-white bg-white/[0.08] border border-[#00f068]/20",
  danger: "text-white bg-red-500/[0.88]",
  ghost: "text-[#00f068] bg-transparent border border-[#00f068]/28 hover:bg-[#00f068]/8",
};

export function Button({ children, className = "", variant = "primary", fullWidth, ...props }: ButtonProps) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${fullWidth ? "w-full" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}