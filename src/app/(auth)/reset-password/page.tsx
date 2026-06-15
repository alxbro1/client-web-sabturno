"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
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
      setError(message || "No se pudo restablecer la contrasena. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.96),rgba(8,8,8,0.94)),radial-gradient(circle_at_top_right,rgba(0,240,104,0.12),transparent_38%)] shadow-[0_22px_56px_rgba(0,0,0,0.36)] backdrop-blur-[14px] p-8 flex flex-col gap-5 min-w-0">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#ff5678]">
          Error
        </p>
        <h2>Enlace invalido</h2>
        <p>El enlace de restablecimiento no es valido o ha expirado.</p>
        <Link
          className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72"
          href="/forgot-password"
        >
          Solicitar nuevo enlace
        </Link>
      </section>
    );
  }

  if (success) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.96),rgba(8,8,8,0.94)),radial-gradient(circle_at_top_right,rgba(0,240,104,0.12),transparent_38%)] shadow-[0_22px_56px_rgba(0,0,0,0.36)] backdrop-blur-[14px] p-8 flex flex-col gap-5 min-w-0">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
          Exito
        </p>
        <h2>Contrasena restablecida</h2>
        <div className="rounded-2xl border border-[#00f068]/32 bg-[rgba(3,58,29,0.36)] px-4 py-[0.95rem] text-[#cdfbe1]">
          Tu contrasena fue actualizada correctamente.
        </div>
        <Link href="/login">
          <Button fullWidth>Ir al login</Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.96),rgba(8,8,8,0.94)),radial-gradient(circle_at_top_right,rgba(0,240,104,0.12),transparent_38%)] shadow-[0_22px_56px_rgba(0,0,0,0.36)] backdrop-blur-[14px] p-8 flex flex-col gap-5 min-w-0">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
        Restablecer
      </p>
      <h2>Nueva contrasena</h2>
      <p>Ingresa tu nueva contrasena.</p>

      <form className="grid gap-[1.1rem]" onSubmit={handleSubmit}>
        <InputField
          label="Nueva contrasena"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          errors={passwordErrors}
        />
        <InputField
          label="Confirmar contrasena"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          errors={confirmErrors}
        />
        {error ? (
          <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
            {error}
          </div>
        ) : null}
        <Button type="submit" disabled={!isFormValid || loading} fullWidth>
          {loading ? "Restableciendo..." : "Restablecer contrasena"}
        </Button>
      </form>

      <Link
        className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72"
        href="/login"
      >
        Volver al login
      </Link>
    </section>
  );
}
