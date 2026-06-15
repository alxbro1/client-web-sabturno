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
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.96),rgba(8,8,8,0.94)),radial-gradient(circle_at_top_right,rgba(0,240,104,0.12),transparent_38%)] shadow-[0_22px_56px_rgba(0,0,0,0.36)] backdrop-blur-[14px] p-8 flex flex-col gap-5 min-w-0">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Recuperacion</p>
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
        {message ? <div className="rounded-2xl border border-[#00f068]/32 bg-[rgba(3,58,29,0.36)] px-4 py-[0.95rem] text-[#cdfbe1]">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">{error}</div> : null}
        <Button type="submit" disabled={!isFormValid || loading} fullWidth>
          {loading ? "Enviando..." : "Enviar enlace"}
        </Button>
      </form>

      <Link className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72" to="/login">
        Volver al login
      </Link>
    </section>
  );
}