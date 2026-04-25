import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import { validateEmail } from "@/lib/utils/validation";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth";

type LoginLocationState = {
  from?: string;
  emailVerificationPending?: boolean;
  registeredEmail?: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailDirty, setEmailDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const locationState = location.state as LoginLocationState | null;

  const emailValidation = useMemo(() => validateEmail(email), [email]);
  const isFormValid =
    emailValidation.length === 0 &&
    email.trim().length > 0 &&
    password.length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authService.login({ email: email.trim(), password });
      if (response.user.isLocal) {
        setError("Esta web esta preparada solo para clientes.");
        return;
      }
      login(response.user, response.token);
      navigate(locationState?.from || "/home", { replace: true });
    } catch (caughtError: any) {
      setError(caughtError?.response?.data?.message || "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.96),rgba(8,8,8,0.94)),radial-gradient(circle_at_top_right,rgba(0,240,104,0.12),transparent_38%)] shadow-[0_22px_56px_rgba(0,0,0,0.36)] backdrop-blur-[14px] p-8 flex flex-col gap-5 min-w-0">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Acceso cliente</p>
      <h2>Inicia sesion</h2>
      <p>Usa las mismas credenciales de la app para gestionar turnos y pagos desde la web.</p>

      {locationState?.emailVerificationPending ? (
        <div className="rounded-2xl px-4 py-[0.95rem] border border-emerald-300/35 bg-emerald-950/30 text-emerald-100">
          Revisa tu correo{locationState.registeredEmail ? ` (${locationState.registeredEmail})` : ""} y verifica tu cuenta antes de iniciar sesion.
        </div>
      ) : null}

      <form className="grid gap-[1.1rem]" onSubmit={handleSubmit}>
        <InputField
          label="Correo electronico"
          type="email"
          value={email}
          onChange={(event) => {
            setEmailDirty(true);
            setEmail(event.target.value);
          }}
          errors={emailDirty ? emailValidation : undefined}
          placeholder="tu@email.com"
        />
        <InputField
          label="Contrasena"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Tu contrasena"
        />

        {error ? <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">{error}</div> : null}

        <Button type="submit" disabled={!isFormValid || loading} fullWidth>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-4">
        <Link className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72" to="/register">
          ¿No tienes cuenta? Regístrate
        </Link>
        <Link className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72" to="/forgot-password">
          ¿Olvidaste tu contraseña?
        </Link>
        <a className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72" href="https://sabturno.com/politica-de-privacidad.html" target="_blank" rel="noreferrer">
          Política de privacidad
        </a>
      </div>
    </section>
  );
}