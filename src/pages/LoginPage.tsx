import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import { validateEmail } from "@/lib/utils/validation";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailDirty, setEmailDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

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
      navigate((location.state as { from?: string } | null)?.from || "/home", { replace: true });
    } catch (caughtError: any) {
      setError(caughtError?.response?.data?.message || "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="p-8 rounded-3xl bg-[rgba(7,16,26,0.92)] flex flex-col gap-5 min-w-0">
      <p className="eyebrow">Acceso cliente</p>
      <h2>Inicia sesion</h2>
      <p>Usa las mismas credenciales de la app para gestionar turnos y pagos desde la web.</p>

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

        {error ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{error}</div> : null}

        <Button type="submit" disabled={!isFormValid || loading} fullWidth>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-4">
        <Link className="text-sky-300" to="/register">
          ¿No tienes cuenta? Regístrate
        </Link>
        <Link className="text-sky-300" to="/forgot-password">
          ¿Olvidaste tu contraseña?
        </Link>
        <a className="text-sky-300" href="https://sabturno.com/politica-de-privacidad.html" target="_blank" rel="noreferrer">
          Política de privacidad
        </a>
      </div>
    </section>
  );
}