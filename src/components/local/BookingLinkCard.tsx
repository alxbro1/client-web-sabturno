"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { buildLocalBookingPath } from "@/lib/utils/bookingQuery";

const COPIED_FEEDBACK_MS = 2000;
const COPY_ERROR_MESSAGE = "No se pudo copiar. Seleccioná el link y copialo a mano.";

type BookingLinkCardProps = {
  localId: string;
};

/**
 * Lets the local owner copy the public deep link that opens the booking flow
 * already scoped to their local. The absolute URL depends on the browser
 * origin, so it is computed after mount to keep SSR and hydration identical.
 */
export function BookingLinkCard({ localId }: BookingLinkCardProps) {
  const inputId = useId();
  const hintId = useId();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}${buildLocalBookingPath(localId)}`);
  }, [localId]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

    try {
      await navigator.clipboard.writeText(url);
      setCopyFailed(false);
      setCopied(true);
      toast.success("Link copiado");
      resetTimeoutRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch (error) {
      console.error("No se pudo copiar el link de reserva", error);
      setCopied(false);
      setCopyFailed(true);
      toast.error(COPY_ERROR_MESSAGE);
    }
  }

  return (
    <section className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-6 shadow-sm max-sm:p-4">
      <div className="min-w-0">
        <label htmlFor={inputId} className="block text-lg font-semibold text-foreground">
          Tu link de reserva
        </label>
        <p id={hintId} className="mt-1 text-sm text-muted-foreground">
          Compartilo con tus clientes para que reserven directo en tu local.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-sm:grid-cols-1">
        <input
          id={inputId}
          type="text"
          readOnly
          value={url}
          aria-describedby={hintId}
          onFocus={(event) => event.currentTarget.select()}
          className="h-11 w-full min-w-0 rounded-xl border border-input bg-muted/30 px-4 text-sm text-foreground outline-none transition focus-visible:border-primary/70 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <Button className="h-11" onClick={handleCopy} disabled={!url}>
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>

      <p role="status" className="min-h-5 text-sm text-primary">
        {copied ? "Link copiado" : ""}
      </p>
      {copyFailed && (
        <p role="alert" className="text-sm text-destructive">
          {COPY_ERROR_MESSAGE}
        </p>
      )}
    </section>
  );
}
