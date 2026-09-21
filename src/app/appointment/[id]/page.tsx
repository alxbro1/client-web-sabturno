import Link from "next/link";
import { formatLocalDate } from "@/lib/utils/date";
import { DEFAULT_TIMEZONE } from "@/lib/constants/countries";

export const dynamic = "force-dynamic";

const STATE_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://app-api.sabturno.com";

type FetchOutcome =
  | { ok: true; appointment: AppointmentPublic }
  | { ok: false; reason: "not-found" | "unavailable" };

interface AppointmentPublic {
  id: number;
  state: string;
  startDateTime: string;
  timezone?: string | null;
  finalAmount?: number | string | null;
  service?: { name?: string | null } | null;
  local?: { name?: string | null } | null;
}

/**
 * Esta pantalla se renderiza en el servidor, así que NO puede usar `apiService`:
 * su interceptor llama a `getSession()` de `next-auth/react`, que es un módulo
 * "use client". Invocarlo desde un Server Component lanza antes de que salga el
 * HTTP, y el turno se ve siempre como "no disponible". El endpoint es público,
 * no necesita sesión: va por `fetch` directo.
 */
async function fetchAppointment(
  id: string,
  hash: string,
): Promise<FetchOutcome> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/appointments/${id}/public?hash=${encodeURIComponent(hash)}`,
      { cache: "no-store" },
    );

    if (response.status === 404 || response.status === 400) {
      return { ok: false, reason: "not-found" };
    }
    if (!response.ok) {
      console.error(
        `[appointment/${id}] el backend respondió ${response.status}`,
      );
      return { ok: false, reason: "unavailable" };
    }

    return { ok: true, appointment: (await response.json()) as AppointmentPublic };
  } catch (error) {
    console.error(`[appointment/${id}] no se pudo consultar el turno:`, error);
    return { ok: false, reason: "unavailable" };
  }
}

export default async function AppointmentPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hash?: string }>;
}) {
  const { id } = await params;
  const { hash } = await searchParams;

  if (!hash) {
    return (
      <PublicShell title="Enlace incompleto">
        <p className="text-muted-foreground">
          Este enlace no incluye el código del turno. Abrilo desde el mensaje
          que te enviamos por WhatsApp o por correo.
        </p>
      </PublicShell>
    );
  }

  const result = await fetchAppointment(id, hash);

  if (!result.ok) {
    return result.reason === "not-found" ? (
      <PublicShell title="Turno no disponible">
        <p className="text-muted-foreground">
          No encontramos este turno. Puede que el enlace sea inválido o que haya
          vencido.
        </p>
      </PublicShell>
    ) : (
      <PublicShell title="No pudimos cargar el turno">
        <p className="text-muted-foreground">
          Hubo un problema al consultar tu turno. Probá de nuevo en unos
          minutos.
        </p>
      </PublicShell>
    );
  }

  const { appointment } = result;
  const timezone = appointment.timezone || DEFAULT_TIMEZONE;
  const stateLabel = STATE_LABELS[appointment.state] || appointment.state;
  const cancellable =
    appointment.state === "CONFIRMED" || appointment.state === "PENDING";

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <section className="w-full max-w-140 rounded-[24px] border border-border bg-card p-7 shadow-[0_18px_40px_rgba(0,0,0,0.34)] sm:p-8 flex flex-col gap-6 min-w-0 text-center">
        <div className="grid gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Turno #{appointment.id ?? id}
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            {appointment.service?.name || "Tu turno"}
          </h2>

          <div className="grid gap-1 text-muted-foreground text-sm">
            <p>{appointment.local?.name}</p>
            <p className="first-letter:uppercase">
              {formatLocalDate(
                appointment.startDateTime,
                timezone,
                "EEEE d 'de' MMMM 'a las' HH:mm",
              )}
            </p>
            {appointment.finalAmount !== undefined &&
              appointment.finalAmount !== null && (
                <p>${Number(appointment.finalAmount).toLocaleString("es-AR")}</p>
              )}
          </div>

          <span
            className={`inline-flex justify-self-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider ${
              appointment.state === "CANCELLED"
                ? "bg-destructive/15 text-destructive"
                : "bg-primary/15 text-primary"
            }`}
          >
            {stateLabel}
          </span>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          {cancellable ? (
            <Link
              href={`/appointment/${id}/cancel?hash=${encodeURIComponent(hash)}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-destructive px-6 py-3 font-semibold text-destructive-foreground transition-colors outline-none hover:bg-destructive/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Cancelar turno
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Volver al inicio
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function PublicShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <section className="w-full max-w-140 rounded-[24px] border border-border bg-card p-7 shadow-[0_18px_40px_rgba(0,0,0,0.34)] sm:p-8 flex flex-col gap-6 min-w-0 text-center">
        <div className="grid gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Turno
          </p>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {children}
        </div>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Volver al inicio
        </Link>
      </section>
    </div>
  );
}
