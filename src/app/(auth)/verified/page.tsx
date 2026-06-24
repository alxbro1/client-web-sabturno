"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import { validateEmail } from "@/lib/utils/validation";
import { authService } from "@/services/auth";

export default function VerifiedPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") !== "false";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errors = useMemo(() => validateEmail(email), [email]);
  const isFormValid = errors.length === 0 && email.trim() !== "";

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await authService.resendVerification(email.trim());
      setMessage("Correo de verificacion reenviado. Revisa tu bandeja de entrada.");
    } catch {
      setError("No se pudo reenviar el correo. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center gap-2">
        <div className="mx-auto">
          <LogoMark className="h-10 w-auto" />
        </div>
        <div className="grid gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Verificacion
          </p>
          <h2 className="text-[1.7rem] leading-none font-semibold">
            {success ? "Correo verificado" : "Error de verificacion"}
          </h2>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        <p className="text-center text-muted-foreground">
          {success
            ? "Tu correo ha sido verificado correctamente. Ya puedes iniciar sesion."
            : "No se pudo verificar tu correo. El enlace puede haber expirado."}
        </p>

        {!success && (
          <form className="grid gap-4" onSubmit={handleResend}>
            <p className="text-center text-muted-foreground text-sm">
              Ingresa tu correo para recibir un nuevo enlace de verificacion.
            </p>
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
              {loading ? "Enviando..." : "Reenviar verificacion"}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center">
        <Link
          className="text-sm text-info underline decoration-info/30 underline-offset-2 transition-colors hover:text-info/80 hover:decoration-info/70"
          href="/login"
        >
          Ir a iniciar sesion
        </Link>
      </CardFooter>
    </Card>
  );
}
