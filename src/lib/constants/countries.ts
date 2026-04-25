export const VALID_COUNTRY_CODES = [
  { code: "AR", name: "Argentina", flag: "AR" },
] as const;

export type CountryCode = (typeof VALID_COUNTRY_CODES)[number]["code"];

export const DEFAULT_COUNTRY_CODE: CountryCode = "AR";
export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

export const COUNTRY_TIMEZONES: Record<CountryCode, { value: string; label: string }[]> = {
  AR: [
    { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
  ],
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