import { cookies } from "next/headers";

const SESSION_COOKIE = "sabturno_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    isLocal: boolean;
    localName?: string;
    phone: string;
    province?: string;
    address?: string;
    city?: string;
    imageProfile?: string;
    countryCode?: string;
    timezone?: string;
    birthDate?: string;
    mercadoPagoLiveMode?: boolean;
    payWithReservation?: boolean;
    reservationPercentage?: number | null;
    payWithCashInFront?: boolean;
    payWithTalo?: boolean;
    onboardingCompleted?: boolean;
  };
}

export async function createSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return null;

  try {
    return JSON.parse(session.value) as SessionData;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
