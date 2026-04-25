import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    fullWidth?: boolean;
  }
>;

const BASE =
  "border rounded-2xl px-[1.15rem] py-[0.9rem] cursor-pointer font-semibold transition-[opacity,transform,border-color,background-color,color,box-shadow] duration-[140ms] ease-in-out hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f068]/50";

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "text-[#07150d] border-transparent bg-[linear-gradient(180deg,#6bffb0_0%,#00f068_100%)] hover:shadow-[0_16px_34px_rgba(0,240,104,0.26)]",
  secondary:
    "text-white border-white/15 bg-white/[0.04] hover:border-[#00f068]/35 hover:bg-[#00f068]/8",
  danger: "text-white border-[#ff5678]/35 bg-red/85 hover:bg-[#ff5678] rounded-full",
  ghost:
    "text-[#aafad0] border-[#00f068]/30 bg-transparent hover:border-[#00f068]/55 hover:bg-[#00f068]/8",
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