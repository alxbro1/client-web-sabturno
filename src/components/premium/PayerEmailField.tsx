"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidPayerEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

interface PayerEmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

/** Email of the owner's Mercado Pago account, confirmed before checkout. */
export function PayerEmailField({ value, onChange, error }: PayerEmailFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2 max-w-md mx-auto w-full">
      <Label htmlFor={id}>Email de tu cuenta de Mercado Pago</Label>
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoComplete="email"
        className="h-11"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${helpId} ${errorId}` : helpId}
      />
      <p id={helpId} className="text-xs text-muted-foreground">
        Tiene que ser el email con el que iniciás sesión en Mercado Pago. Si es
        distinto, el pago puede ser rechazado.
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * State for the field. Follows the session email until the owner edits it,
 * so it still prefills when the session hydrates after the first render.
 */
export function usePayerEmail(sessionEmail: string | null | undefined) {
  const [edited, setEdited] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const value = edited ?? sessionEmail ?? "";

  function onChange(next: string) {
    setEdited(next);
    setError(null);
  }

  /** Returns the trimmed email when valid; otherwise sets the error and returns null. */
  function validate(): string | null {
    if (!isValidPayerEmail(value)) {
      setError("Ingresá un email válido, por ejemplo nombre@correo.com.");
      return null;
    }
    return value.trim();
  }

  return { value, validate, fieldProps: { value, onChange, error } };
}
