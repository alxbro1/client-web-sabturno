import Link from "next/link";
import { getAppointmentPublic } from "@/services/booking";
import { formatLocalDate } from "@/lib/utils/date";
import { DEFAULT_TIMEZONE } from "@/lib/constants/countries";

export function generateStaticParams() {
  return [];
}

const STATE_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
};

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
      <PublicShell>
        <p className="text-muted-foreground">
          No se proporciono un enlace valido.
        </p>
      </PublicShell>
    );
  }

  let appointment: any;
  try {
    appointment = await getAppointmentPublic(id, hash);
  } catch {
    return (
      <PublicShell>
        <p className="text-muted-foreground">
          No se encontro el turno o el enlace expiro.
        </p>
      </PublicShell>
    );
  }

  const timezone = appointment?.timezone || DEFAULT_TIMEZONE;
  const stateLabel = STATE_LABELS[appointment?.state] || appointment?.state;
  const cancellable =
    appointment?.state === "CONFIRMED" || appointment?.state === "PENDING";

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <section className="w-full max-w-140 rounded-[24px] border border-white/10 bg-[#0d0f12]/94 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-[10px] p-7 sm:p-8 flex flex-col gap-6 min-w-0 text-center">
        <div className="grid gap-4">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-primary">
            Turno #{appointment?.id ?? id}
          </p>
          <h2 className="text-[1.7rem] leading-none">
            {appointment?.service?.name || "Tu turno"}
          </h2>

          <div className="grid gap-1 text-muted-foreground text-sm">
            <p>{appointment?.local?.name}</p>
            <p className="capitalize">
              {formatLocalDate(
                appointment.startDateTime,
                timezone,
                "EEEE d 'de' MMMM 'a las' HH:mm",
              )}
            </p>
            {appointment?.finalAmount !== undefined && (
              <p>${Number(appointment.finalAmount).toLocaleString("es-AR")}</p>
            )}
          </div>

          <span
            className={`inline-flex justify-self-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider ${
              appointment?.state === "CANCELLED"
                ? "bg-[#ff5678]/15 text-[#ff5678]"
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
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#ff5678] px-6 py-3 text-white font-semibold hover:bg-[#ff5678]/90 transition-colors"
            >
              Cancelar turno
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-primary px-6 py-3 text-[#0a0a0a] font-semibold hover:bg-primary/90 transition-colors"
            >
              Volver al inicio
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <section className="w-full max-w-140 rounded-[24px] border border-white/10 bg-[#0d0f12]/94 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-[10px] p-7 sm:p-8 flex flex-col gap-6 min-w-0 text-center">
        <div className="grid gap-4">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-primary">
            Turno
          </p>
          <h2 className="text-[1.7rem] leading-none">Turno no disponible</h2>
          {children}
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-primary px-6 py-3 text-[#0a0a0a] font-semibold hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </section>
    </div>
  );
}