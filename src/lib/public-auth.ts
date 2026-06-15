export interface PublicAuthParams {
  id: string;
  hash: string;
}

export function buildPublicAppointmentUrl(id: string, hash: string): string {
  return `/appointment/${id}?hash=${encodeURIComponent(hash)}`;
}

export function parsePublicAuthFromSearchParams(
  searchParams: URLSearchParams
): PublicAuthParams | null {
  const hash = searchParams.get("hash");
  if (!hash) return null;
  return { id: "", hash }; // ID comes from path params
}

export async function fetchPublicAppointment(id: string, hash: string) {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://app-api.sabturno.com";

  const response = await fetch(
    `${API_BASE_URL}/appointments/${id}/public?hash=${encodeURIComponent(hash)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar el turno");
  }

  return response.json();
}
