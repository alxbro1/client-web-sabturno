"use client";

import { use, useState } from "react";
import Link from "next/link";
import { bookingService } from "@/services/booking";

export default function AppointmentCancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hash?: string }>;
}) {
  const { id } = use(params);
  const { hash } = use(searchParams);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  async function handleCancel() {
    if (!hash) return;
    setStatus("loading");
    try {
      await bookingService.cancelAppointmentPublic(id, hash);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <section className="w-full max-w-140 rounded-[24px] border border-white/10 bg-[#0d0f12]/94 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-[10px] p-7 sm:p-8 flex flex-col gap-6 min-w-0 text-center">
        <div className="grid gap-4">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#ff5678]">
            Cancelar turno
          </p>
          <h2 className="text-[1.7rem] leading-none">
            {status === "success"
              ? "Turno cancelado"
              : status === "error"
                ? "No se pudo cancelar"
                : `Cancelar turno #${id}`}
          </h2>
          <p className="text-white/68">
            {status === "success"
              ? "Tu turno fue cancelado correctamente."
              : status === "error"
                ? "Hubo un problema al cancelar el turno. Intentalo de nuevo."
                : hash
                  ? "¿Estas seguro que deseas cancelar este turno?"
                  : "No se proporciono un enlace valido."}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          {status === "success" ? (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#00f068] px-6 py-3 text-[#0a0a0a] font-semibold hover:bg-[#00f068]/90 transition-colors"
            >
              Volver al inicio
            </Link>
          ) : (
            <>
              <Link
                href={`/appointment/${id}?hash=${encodeURIComponent(hash || "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/12 px-6 py-3 text-white/75 hover:bg-white/[0.02] transition-colors"
              >
                Volver
              </Link>
              {hash && (
                <button
                  type="button"
                  disabled={status === "loading"}
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#ff5678] px-6 py-3 text-white font-semibold hover:bg-[#ff5678]/90 transition-colors disabled:opacity-60"
                >
                  {status === "loading"
                    ? "Cancelando..."
                    : "Confirmar cancelacion"}
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}