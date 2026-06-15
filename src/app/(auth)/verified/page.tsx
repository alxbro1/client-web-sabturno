"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
    <section className="w-full max-w-140 rounded-[24px] border border-white/10 bg-[#0d0f12]/94 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-[10px] p-7 sm:p-8 flex flex-col gap-6 min-w-0">
      <div className="grid gap-4 text-center">
        <div className="mx-auto px-5 py-3">
          <LogoMark className="h-10 w-auto" />
        </div>
        <div className="grid gap-2">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#00f068]">
            Verificacion
          </p>
          <h2 className="text-[1.7rem] leading-none">
            {success ? "Correo verificado" : "Error de verificacion"}
          </h2>
        </div>
      </div>

      <div className="grid gap-4">
        <p className="text-center text-white/68">
          {success
            ? "Tu correo ha sido verificado correctamente. Ya puedes iniciar sesion."
            : "No se pudo verificar tu correo. El enlace puede haber expirado."}
        </p>
      </div>

      {!success && (
        <form className="grid gap-[1.1rem]" onSubmit={handleResend}>
          <p className="text-center text-white/54 text-[0.9rem]">
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
            <div className="rounded-2xl border border-[#00f068]/32 bg-[rgba(3,58,29,0.36)] px-4 py-[0.95rem] text-[#cdfbe1]">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
              {error}
            </div>
          ) : null}
          <Button type="submit" disabled={!isFormValid || loading} fullWidth>
            {loading ? "Enviando..." : "Reenviar verificacion"}
          </Button>
        </form>
      )}

      <div className="grid gap-3 pt-1 text-center">
        <Link
          className="text-[#7bcfff] text-[0.95rem] decoration-[#7bcfff]/45 transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72"
          href="/login"
        >
          Ir a iniciar sesion
        </Link>
      </div>
    </section>
  );
}
