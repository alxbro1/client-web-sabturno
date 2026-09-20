import { cn } from "@/lib/utils";

export function LogoFull() {
  return (
    <img
      src="/white_logotype.webp"
      alt="SabTurno"
      className="h-8 w-auto"
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/white_logotype.webp"
      alt="SabTurno"
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}

export function LogoText() {
  return (
    <img
      src="/white_logotype.webp"
      alt="SabTurno"
      className="h-6 w-auto"
    />
  );
}
