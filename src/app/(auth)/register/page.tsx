"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { InputField, SelectField } from "@/components/Field";
import {
  LocationFields,
  type LocationFieldsValue,
} from "@/components/LocationFields";
import { UserTypeToggle } from "@/components/UserTypeToggle";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  type CountryCode,
  DEFAULT_COUNTRY_CODE,
  getDeviceTimezone,
  getTimezonesForCountry,
  VALID_COUNTRY_CODES,
} from "@/lib/constants/countries";
import {
  type RegisterFormData,
  checkStrongPasswordRequirements,
  validateRegisterForm,
  validateLocalRegisterForm,
} from "@/lib/utils/validation";
import { authService } from "@/services/auth";
import { LogoMark } from "@/components/Logo";
import { useClientTypeStore } from "@/stores/clientType";

const INITIAL_FORM: RegisterFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  countryCode: DEFAULT_COUNTRY_CODE,
  timezone: getDeviceTimezone(),
  acceptTerms: false,
  province: "",
  city: "",
  address: "",
};

const INITIAL_LOCATION: LocationFieldsValue = {
  province: "",
  city: "",
  address: "",
  // emergencyPhone: "",
};

const INITIAL_TOUCHED: Record<keyof RegisterFormData, boolean> = {
  name: false,
  email: false,
  password: false,
  confirmPassword: false,
  phone: false,
  countryCode: false,
  timezone: false,
  acceptTerms: false,
  province: false,
  city: false,
  address: false,
};

const ALL_TOUCHED: Record<keyof RegisterFormData, boolean> = {
  name: true,
  email: true,
  password: true,
  confirmPassword: true,
  phone: true,
  countryCode: true,
  timezone: true,
  acceptTerms: true,
  province: true,
  city: true,
  address: true,
};

export default function RegisterPage() {
  const router = useRouter();
  const { isBusiness, reset: resetClientType } = useClientTypeStore();
  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM);
  const [location, setLocation] =
    useState<LocationFieldsValue>(INITIAL_LOCATION);
  const [touched, setTouched] =
    useState<Record<keyof RegisterFormData, boolean>>(INITIAL_TOUCHED);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  // Limpia el toggle de cliente/local al desmontar la pantalla.
  useEffect(() => {
    return () => resetClientType();
  }, [resetClientType]);

  const validation = useMemo(
    () =>
      isBusiness
        ? validateLocalRegisterForm({ ...formData, ...location })
        : validateRegisterForm(formData),
    [formData, location, isBusiness],
  );

  const isFormValid =
    Object.values(validation).every(
      (errors) => !errors || errors.length === 0,
    ) &&
    formData.name.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.password.length > 0 &&
    formData.phone.trim().length > 0 &&
    formData.acceptTerms &&
    (!isBusiness ||
      (location.province && location.city && location.address.trim()));

  const timezones = getTimezonesForCountry(formData.countryCode);

  function updateField<Key extends keyof RegisterFormData>(
    field: Key,
    value: RegisterFormData[Key],
  ) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    setFormData((current) => ({
      ...current,
      [field]: value,
      ...(field === "countryCode"
        ? {
            timezone:
              getTimezonesForCountry(value as CountryCode)[0]?.value ||
              current.timezone,
          }
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
        isLocal: isBusiness,
        ...(isBusiness && {
          province: location.province,
          city: location.city,
          address: location.address.trim(),
          // emergencyPhone: location.emergencyPhone.trim() || undefined,
        }),
        countryCode: formData.countryCode,
        timezone: formData.timezone,
      });
      resetClientType();
      router.replace("/login?emailVerificationPending=true");
    } catch (caughtError: any) {
      setError(
        caughtError?.response?.data?.message || "No se pudo crear la cuenta",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[660px]">
      <CardHeader className="text-center gap-2">
        <div className="mx-auto">
          <LogoMark className="h-10 w-auto" />
        </div>
        <div className="grid gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {isBusiness ? "Nuevo local" : "Nuevo cliente"}
          </p>
          <h2 className="text-[1.7rem] leading-none font-semibold">
            Crea tu cuenta
          </h2>
          <p className="text-muted-foreground text-sm">
            {isBusiness
              ? "Registra tu local para empezar a recibir reservas online."
              : "Completa tus datos para reservar turnos desde la web."}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <UserTypeToggle />

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 items-start max-sm:grid-cols-1">
            <InputField
              label={isBusiness ? "Nombre del local" : "Nombre"}
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
              errors={touched.name ? validation.name : undefined}
              placeholder={isBusiness ? "Nombre de tu negocio" : undefined}
            />

            <InputField
              label="Correo electronico"
              type="email"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
              errors={touched.email ? validation.email : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-start max-sm:grid-cols-1">
            <div className="grid gap-1">
              <InputField
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                errors={touched.password ? validation.password : undefined}
              />
              {isBusiness && passwordFocus ? (
                <ul className="space-y-0.5 text-xs">
                  {checkStrongPasswordRequirements(formData.password).map(
                    (req) => (
                      <li
                        key={req.label}
                        className={
                          req.met ? "text-[#00f068]" : "text-muted-foreground"
                        }
                      >
                        {req.met ? "✓ " : "• "}
                        {req.label}
                      </li>
                    ),
                  )}
                </ul>
              ) : null}
            </div>
            <InputField
              label="Confirmar contraseña"
              type="password"
              value={formData.confirmPassword}
              onChange={(event) =>
                updateField("confirmPassword", event.target.value)
              }
              errors={
                touched.confirmPassword ? validation.confirmPassword : undefined
              }
            />
          </div>

          <InputField
            label="Telefono"
            value={formData.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            errors={touched.phone ? validation.phone : undefined}
          />

          {isBusiness && (
            <LocationFields
              value={location}
              onChange={setLocation}
              errors={{
                province: touched.province ? validation.province : undefined,
                city: touched.city ? validation.city : undefined,
                address: touched.address ? validation.address : undefined,
              }}
            />
          )}

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <SelectField
              label="Pais"
              value={formData.countryCode}
              onChange={(event) =>
                updateField("countryCode", event.target.value as CountryCode)
              }
            >
              {VALID_COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Zona horaria"
              value={formData.timezone}
              onChange={(event) => updateField("timezone", event.target.value)}
            >
              {timezones.map((timezone) => (
                <option key={timezone.value} value={timezone.value}>
                  {timezone.label}
                </option>
              ))}
            </SelectField>
          </div>

          <label className="flex gap-3 items-start">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(event) =>
                updateField("acceptTerms", event.target.checked)
              }
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              Acepto los{" "}
              <a
                href="https://sabturno.com/terminos-y-condiciones.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-info underline decoration-info/30 underline-offset-2 transition-colors hover:text-info/80 hover:decoration-info/70"
              >
                terminos y condiciones
              </a>{" "}
              y la{" "}
              <a
                href="https://sabturno.com/politica-de-privacidad.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-info underline decoration-info/30 underline-offset-2 transition-colors hover:text-info/80 hover:decoration-info/70"
              >
                politica de privacidad
              </a>
              .
            </span>
          </label>
          {(touched.acceptTerms ? validation.acceptTerms : []).map(
            (errorText) => (
              <span key={errorText} className="text-sm text-destructive">
                {errorText}
              </span>
            ),
          )}

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={!isFormValid || loading} fullWidth>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col items-start gap-3 pt-1">
        <Link
          className="text-sm text-info underline decoration-info/30 underline-offset-2 transition-colors hover:text-info/80 hover:decoration-info/70"
          href="/login"
        >
          Ya tienes cuenta? Inicia sesion
        </Link>
      </CardFooter>
    </Card>
  );
}
