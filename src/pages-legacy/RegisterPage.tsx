import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { InputField, SelectField } from "@/components/Field";
import {
  type CountryCode,
  DEFAULT_COUNTRY_CODE,
  getDeviceTimezone,
  getTimezonesForCountry,
  VALID_COUNTRY_CODES,
} from "@/lib/constants/countries";
import { type RegisterFormData, validateRegisterForm } from "@/lib/utils/validation";
import { authService } from "@/services/auth";
import { LogoMark } from "@/components/Logo";

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

const INITIAL_TOUCHED: Record<keyof RegisterFormData, boolean> = {
  name: false,
  email: false,
  password: false,
  confirmPassword: false,
  phone: false,
  birthDate: false,
  countryCode: false,
  timezone: false,
  acceptTerms: false,
};

const ALL_TOUCHED: Record<keyof RegisterFormData, boolean> = {
  name: true,
  email: true,
  password: true,
  confirmPassword: true,
  phone: true,
  birthDate: true,
  countryCode: true,
  timezone: true,
  acceptTerms: true,
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState<Record<keyof RegisterFormData, boolean>>(INITIAL_TOUCHED);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validation = useMemo(() => validateRegisterForm(formData), [formData]);
  const isFormValid =
    Object.values(validation).every((errors) => errors.length === 0) &&
    formData.name.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.password.length > 0 &&
    formData.phone.trim().length > 0 &&
    formData.birthDate.trim().length > 0 &&
    formData.acceptTerms;

  const timezones = getTimezonesForCountry(formData.countryCode);

  function updateField<Key extends keyof RegisterFormData>(field: Key, value: RegisterFormData[Key]) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    setFormData((current) => ({
      ...current,
      [field]: value,
      ...(field === "countryCode"
        ? { timezone: getTimezonesForCountry(value as CountryCode)[0]?.value || current.timezone }
        : {}),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid) {
      setTouched(ALL_TOUCHED);
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
      navigate("/login", {
        replace: true,
        state: {
          emailVerificationPending: true,
          registeredEmail: formData.email.trim(),
        },
      });
    } catch (caughtError: any) {
      setError(caughtError?.response?.data?.message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-[660px] rounded-[24px] border border-white/10 bg-[#0d0f12]/94 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-[10px] p-7 sm:p-8 flex flex-col gap-6 min-w-0">
      <div className="grid gap-4 text-center">
        <div className="mx-auto px-5 py-3">
          <LogoMark className="h-10 w-auto" />
        </div>
        <div className="grid gap-2">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#00f068]">Nuevo cliente</p>
          <h2 className="text-[1.7rem] leading-none">Crea tu cuenta</h2>
          <p className="text-white/62">Completa tus datos para reservar turnos desde la web.</p>
        </div>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <InputField label="Nombre" value={formData.name} onChange={(event) => updateField("name", event.target.value)} errors={touched.name ? validation.name : undefined} />
          <InputField label="Telefono" value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} errors={touched.phone ? validation.phone : undefined} />
        </div>

        <InputField label="Correo electronico" type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} errors={touched.email ? validation.email : undefined} />

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <InputField label="Contraseña" type="password" value={formData.password} onChange={(event) => updateField("password", event.target.value)} errors={touched.password ? validation.password : undefined} />
          <InputField label="Confirmar Contraseña" type="password" value={formData.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} errors={touched.confirmPassword ? validation.confirmPassword : undefined} />
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <InputField label="Fecha de nacimiento" type="date" value={formData.birthDate} onChange={(event) => updateField("birthDate", event.target.value)} errors={touched.birthDate ? validation.birthDate : undefined} />
          <SelectField label="Pais" value={formData.countryCode} onChange={(event) => updateField("countryCode", event.target.value as CountryCode)}>
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
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(event) => updateField("acceptTerms", event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#00f068]"
          />
          <span>
            Acepto los <a href="https://sabturno.com/terminos-y-condiciones.html" target="_blank" rel="noopener noreferrer" className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72">terminos y condiciones</a> y la <a href="https://sabturno.com/politica-de-privacidad.html" target="_blank" rel="noopener noreferrer" className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72">politica de privacidad</a>.
          </span>
        </label>
        {(touched.acceptTerms ? validation.acceptTerms : []).map((errorText) => (
          <span key={errorText} className="text-rose-300 text-[0.84rem]">{errorText}</span>
        ))}

        {error ? <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">{error}</div> : null}

        <Button type="submit" disabled={!isFormValid || loading} fullWidth>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <div className="grid gap-3 pt-1 text-center sm:text-left">
        <Link className="text-[#7bcfff] text-[0.95rem] decoration-[#7bcfff]/45 transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72" to="/login">
          Ya tienes cuenta? Inicia sesion
        </Link>
      </div>
    </section>
  );
}