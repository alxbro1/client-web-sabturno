/**
 * External-link builders for the local profile's contact actions
 * (WhatsApp, phone call, Google Maps, Instagram). All return `null` when
 * there is not enough data, so the caller can hide the corresponding button
 * instead of rendering a dead link.
 */

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * `https://wa.me/<digits>` deep link. If `phone` does not already start with
 * the given `countryCode` digits, they are prefixed.
 *
 * Deliberately conservative: it does not attempt country-specific mobile
 * formatting (e.g. Argentina's extra "9" for `wa.me` mobile numbers) — that
 * is a business rule beyond what this task specified, left for a follow-up
 * if a real business reports the link failing to open a chat.
 */
export function buildWhatsappUrl(
  phone: string | null | undefined,
  countryCode?: string | null,
): string | null {
  if (!phone) return null;
  const digits = onlyDigits(phone);
  if (!digits) return null;

  const countryDigits = countryCode ? onlyDigits(countryCode) : "";
  const alreadyPrefixed = !countryDigits || digits.startsWith(countryDigits);
  const fullNumber = alreadyPrefixed ? digits : `${countryDigits}${digits}`;

  return `https://wa.me/${fullNumber}`;
}

/** `tel:` link, keeping an optional leading `+` and stripping formatting. */
export function buildTelUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = onlyDigits(trimmed);
  if (!digits) return null;

  return `tel:${hasPlus ? "+" : ""}${digits}`;
}

/** Google Maps search URL for the local's address. */
export function buildMapsUrl(
  address: string | null | undefined,
  city?: string | null,
  province?: string | null,
): string | null {
  if (!address?.trim()) return null;

  const query = [address, city, province]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Instagram profile URL from a bare handle (no `@`, already normalized by the backend). */
export function buildInstagramUrl(handle: string | null | undefined): string | null {
  if (!handle?.trim()) return null;
  return `https://instagram.com/${handle.trim()}`;
}
