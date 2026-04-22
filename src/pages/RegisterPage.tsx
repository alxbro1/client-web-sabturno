import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { InputField, SelectField } from "@/components/Field";
import {
  DEFAULT_COUNTRY_CODE,
  getDeviceTimezone,
  getTimezonesForCountry,
  VALID_COUNTRY_CODES,
} from "@/lib/constants/countries";
import { type RegisterFormData, validateRegisterForm } from "@/lib/utils/validation";
import { authService } from "@/services/auth";

const INITIAL_FORM: RegisterFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  birthDate: "",
  countryCode: DEFAULT_COUNTRY_CODE,
  timezone: getDeviceTimezone(),
  acceptTerms: false,
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validation = useMemo(() => validateRegisterForm(formData), [formData]);
  const isFormValid =
    Object.values(validation).every((errors) => errors.length === 0) &&
    formData.name.trim() &&
    formData.email.trim() &&
    formData.password &&
    formData.phone.trim() &&
    formData.birthDate.trim() &&
    formData.acceptTerms;

  const timezones = getTimezonesForCountry(formData.countryCode as any);

  function updateField<Key extends keyof RegisterFormData>(field: Key, value: RegisterFormData[Key]) {
    setFormData((current) => ({
      ...current,
      [field]: value,
      ...(field === "countryCode"
        ? { timezone: getTimezonesForCountry(value as any)[0]?.value || current.timezone }
        : {}),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        isLocal: false,
        countryCode: formData.countryCode,
        timezone: formData.timezone,
      });
      navigate("/login", { replace: true });
    } catch (caughtError: any) {
      setError(caughtError?.response?.data?.message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="p-8 rounded-3xl bg-[rgba(7,16,26,0.92)] flex flex-col gap-5 min-w-0">
      <p className="eyebrow">Nuevo cliente</p>
      <h2>Crea tu cuenta</h2>
      <p>La web replica el flujo de registro de la app movil, centrado solo en clientes.</p>

      <form className="grid gap-[1.1rem]" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <InputField label="Nombre" value={formData.name} onChange={(event) => updateField("name", event.target.value)} errors={validation.name} />
          <InputField label="Telefono" value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} errors={validation.phone} />
        </div>

        <InputField label="Correo electronico" type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} errors={validation.email} />

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <InputField label="Contrasena" type="password" value={formData.password} onChange={(event) => updateField("password", event.target.value)} errors={validation.password} />
          <InputField label="Confirmar contrasena" type="password" value={formData.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} errors={validation.confirmPassword} />
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <InputField label="Fecha de nacimiento" type="date" value={formData.birthDate} onChange={(event) => updateField("birthDate", event.target.value)} errors={validation.birthDate} />
          <SelectField label="Pais" value={formData.countryCode} onChange={(event) => updateField("countryCode", event.target.value)}>
            {VALID_COUNTRY_CODES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </SelectField>
        </div>

        <SelectField label="Zona horaria" value={formData.timezone} onChange={(event) => updateField("timezone", event.target.value)}>
          {timezones.map((timezone) => (
            <option key={timezone.value} value={timezone.value}>
              {timezone.label}
            </option>
          ))}
        </SelectField>

        <label className="flex gap-[0.8rem] items-start">
          <input type="checkbox" checked={formData.acceptTerms} onChange={(event) => updateField("acceptTerms", event.target.checked)} />
          <span>Acepto los terminos y condiciones y la politica de privacidad.</span>
        </label>
        {validation.acceptTerms.map((errorText) => (
          <span key={errorText} className="text-rose-300 text-[0.84rem]">{errorText}</span>
        ))}

        {error ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{error}</div> : null}

        <Button type="submit" disabled={!isFormValid || loading} fullWidth>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-4">
        <Link className="text-sky-300" to="/login">
          Ya tienes cuenta? Inicia sesion
        </Link>
      </div>
    </section>
  );
}