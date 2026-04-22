export const VALID_COUNTRY_CODES = [
  { code: "AR", name: "Argentina", flag: "AR" },
  { code: "BR", name: "Brasil", flag: "BR" },
  { code: "CL", name: "Chile", flag: "CL" },
  { code: "CO", name: "Colombia", flag: "CO" },
  { code: "MX", name: "Mexico", flag: "MX" },
  { code: "PE", name: "Peru", flag: "PE" },
  { code: "UY", name: "Uruguay", flag: "UY" },
  { code: "PY", name: "Paraguay", flag: "PY" },
  { code: "BO", name: "Bolivia", flag: "BO" },
  { code: "VE", name: "Venezuela", flag: "VE" },
  { code: "EC", name: "Ecuador", flag: "EC" },
] as const;

export type CountryCode = (typeof VALID_COUNTRY_CODES)[number]["code"];

export const DEFAULT_COUNTRY_CODE: CountryCode = "AR";
export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

export const COUNTRY_TIMEZONES: Record<CountryCode, { value: string; label: string }[]> = {
  AR: [
    { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
    { value: "America/Argentina/Cordoba", label: "Cordoba" },
    { value: "America/Argentina/Mendoza", label: "Mendoza" },
  ],
  BR: [
    { value: "America/Sao_Paulo", label: "Sao Paulo" },
    { value: "America/Manaus", label: "Manaus" },
  ],
  CL: [{ value: "America/Santiago", label: "Santiago" }],
  CO: [{ value: "America/Bogota", label: "Bogota" }],
  MX: [
    { value: "America/Mexico_City", label: "Ciudad de Mexico" },
    { value: "America/Cancun", label: "Cancun" },
  ],
  PE: [{ value: "America/Lima", label: "Lima" }],
  UY: [{ value: "America/Montevideo", label: "Montevideo" }],
  PY: [{ value: "America/Asuncion", label: "Asuncion" }],
  BO: [{ value: "America/La_Paz", label: "La Paz" }],
  VE: [{ value: "America/Caracas", label: "Caracas" }],
  EC: [{ value: "America/Guayaquil", label: "Guayaquil" }],
};

export const ALL_VALID_TIMEZONES = Object.values(COUNTRY_TIMEZONES)
  .flat()
  .map((timezone) => timezone.value);

export function getTimezonesForCountry(countryCode: CountryCode) {
  return COUNTRY_TIMEZONES[countryCode] ?? COUNTRY_TIMEZONES.AR;
}

export function getValidTimezone(timezone?: string | null) {
  if (timezone && ALL_VALID_TIMEZONES.includes(timezone)) {
    return timezone;
  }

  return DEFAULT_TIMEZONE;
}

export function getDeviceTimezone() {
  try {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!detectedTimezone || !detectedTimezone.includes("/")) {
      return DEFAULT_TIMEZONE;
    }

    return getValidTimezone(detectedTimezone);
  } catch {
    return DEFAULT_TIMEZONE;
  }
}