import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import { validateEmail } from "@/lib/utils/validation";
import { authService } from "@/services/auth";

export function ForgotPasswordPage() {
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
      setMessage("Te enviamos un enlace para restablecer tu contrasena.");
    } catch {
      setError("No se pudo enviar el email. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="p-8 rounded-3xl bg-[rgba(7,16,26,0.92)] flex flex-col gap-5 min-w-0">
      <p className="eyebrow">Recuperacion</p>
      <h2>Olvidaste tu contrasena?</h2>
      <p>Te enviaremos un enlace para restablecerla.</p>

      <form className="grid gap-[1.1rem]" onSubmit={handleSubmit}>
        <InputField
          label="Correo electronico"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          errors={errors}
        />
        {message ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-green-950/40 text-green-200">{message}</div> : null}
        {error ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{error}</div> : null}
        <Button type="submit" disabled={!isFormValid || loading} fullWidth>
          {loading ? "Enviando..." : "Enviar enlace"}
        </Button>
      </form>

      <Link className="text-sky-300" to="/login">
        Volver al login
      </Link>
    </section>
  );
}