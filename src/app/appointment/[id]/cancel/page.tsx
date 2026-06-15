import Link from "next/link";

export default async function AppointmentCancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hash?: string }>;
}) {
  const { id } = await params;
  const { hash } = await searchParams;

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <section className="w-full max-w-140 rounded-[24px] border border-white/10 bg-[#0d0f12]/94 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-[10px] p-7 sm:p-8 flex flex-col gap-6 min-w-0 text-center">
        <div className="grid gap-4">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#ff5678]">
            Cancelar turno
          </p>
          <h2 className="text-[1.7rem] leading-none">
            Cancelar turno #{id}
          </h2>
          <p className="text-white/68">
            {hash
              ? "¿Estas seguro que deseas cancelar este turno?"
              : "No se proporciono un enlace valido."}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href={`/appointment/${id}?hash=${hash || ""}`}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/12 px-6 py-3 text-white/75 hover:bg-white/[0.02] transition-colors"
          >
            Volver
          </Link>
          {hash && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#ff5678] px-6 py-3 text-white font-semibold hover:bg-[#ff5678]/90 transition-colors"
            >
              Confirmar cancelacion
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
