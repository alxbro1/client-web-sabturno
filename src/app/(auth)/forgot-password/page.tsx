"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { validateEmail } from "@/lib/utils/validation";
import { authService } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errors = useMemo(() => validateEmail(email), [email]);
  const isFormValid = errors.length === 0 && email.trim() !== "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email.trim());
      setMessage("Te enviamos un enlace para restablecer tu contraseña.");
    } catch {
      setError("No se pudo enviar el email. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Recuperacion
        </p>
        <CardTitle>Olvidaste tu contraseña?</CardTitle>
        <CardDescription>
          Te enviaremos un enlace para restablecerla.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <InputField
            label="Correo electronico"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            errors={errors}
          />
          {message ? (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary-foreground">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <Button type="submit" disabled={!isFormValid || loading} fullWidth>
            {loading ? "Enviando..." : "Enviar enlace"}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <Link
          className="text-sm text-info underline decoration-info/30 underline-offset-2 transition-colors hover:text-info/80 hover:decoration-info/70"
          href="/login"
        >
          Volver al login
        </Link>
      </CardFooter>
    </Card>
  );
}
