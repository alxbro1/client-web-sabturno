"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import {
  validatePassword,
  validateConfirmPassword,
} from "@/lib/utils/validation";
import { authService } from "@/services/auth";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordErrors = useMemo(
    () => validatePassword(newPassword),
    [newPassword],
  );
  const confirmErrors = useMemo(
    () => validateConfirmPassword(newPassword, confirmPassword),
    [newPassword, confirmPassword],
  );

  const isFormValid =
    passwordErrors.length === 0 &&
    confirmErrors.length === 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid || !token) return;

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(message || "No se pudo restablecer la contraseña. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-destructive">
            Error
          </p>
          <CardTitle>Enlace invalido</CardTitle>
          <CardDescription>
            El enlace de restablecimiento no es valido o ha expirado.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            className="text-sm text-info underline decoration-info/30 underline-offset-2 transition-colors hover:text-info/80 hover:decoration-info/70"
            href="/forgot-password"
          >
            Solicitar nuevo enlace
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Exito
          </p>
          <CardTitle>Contraseña restablecida</CardTitle>
          <CardDescription className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
            Tu contraseña fue actualizada correctamente.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button fullWidth>Ir al login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Restablecer
        </p>
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>
          Ingresa tu nueva contraseña.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <InputField
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            errors={passwordErrors}
          />
          <InputField
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            errors={confirmErrors}
          />
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <Button type="submit" disabled={!isFormValid || loading} fullWidth>
            {loading ? "Restableciendo..." : "Restablecer contraseña"}
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
