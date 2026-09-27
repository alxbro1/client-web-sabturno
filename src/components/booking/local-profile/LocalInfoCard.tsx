import { MapPin } from "lucide-react";

interface LocalInfoCardProps {
  /** `null` means no schedule data at all — hide the whole open/hours row. */
  isOpen: boolean | null;
  scheduleSummary: string | null;
  address: string;
  paymentChips: string[];
}

export function LocalInfoCard({
  isOpen,
  scheduleSummary,
  address,
  paymentChips,
}: LocalInfoCardProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
      {isOpen !== null && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`inline-block size-2 rounded-full ring-4 ${
              isOpen ? "bg-primary ring-primary/20" : "bg-muted-foreground ring-muted-foreground/15"
            }`}
            aria-hidden="true"
          />
          <span className={isOpen ? "font-medium text-primary" : "font-medium text-muted-foreground"}>
            {isOpen ? "Abierto ahora" : "Cerrado"}
          </span>
          {scheduleSummary && (
            <span className="text-muted-foreground">{scheduleSummary}</span>
          )}
        </div>
      )}

      <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        <span>{address}</span>
      </p>

      {paymentChips.length > 0 && (
        <div data-testid="payment-chips" className="flex flex-wrap gap-1.5">
          {paymentChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
