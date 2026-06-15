import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <section className="w-full max-w-140 rounded-[24px] border border-white/10 bg-[#0d0f12]/94 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-[10px] p-7 sm:p-8 flex flex-col gap-6 min-w-0 text-center">
        <div className="grid gap-4">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#00f068]">
            Error 404
          </p>
          <h2 className="text-[1.7rem] leading-none">Pagina no encontrada</h2>
          <p className="text-white/68">
            La pagina que buscas no existe o fue movida.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#00f068] px-6 py-3 text-[#0a0a0a] font-semibold hover:bg-[#00f068]/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </section>
    </div>
  );
}
