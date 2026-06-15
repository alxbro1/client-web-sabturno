"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/Logo";

export default function VerifiedPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") !== "false";

  return (
    <section className="w-full max-w-140 rounded-[24px] border border-white/10 bg-[#0d0f12]/94 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-[10px] p-7 sm:p-8 flex flex-col gap-6 min-w-0">
      <div className="grid gap-4 text-center">
        <div className="mx-auto px-5 py-3">
          <LogoMark className="h-10 w-auto" />
        </div>
        <div className="grid gap-2">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#00f068]">
            Verificacion
          </p>
          <h2 className="text-[1.7rem] leading-none">
            {success ? "Correo verificado" : "Error de verificacion"}
          </h2>
        </div>
      </div>

      <div className="grid gap-4">
        <p className="text-center text-white/68">
          {success
            ? "Tu correo ha sido verificado correctamente. Ya puedes iniciar sesion."
            : "No se pudo verificar tu correo. El enlace puede haber expirado."}
        </p>
      </div>

      <div className="grid gap-3 pt-1 text-center">
        <Link
          className="text-[#7bcfff] text-[0.95rem] decoration-[#7bcfff]/45 transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72"
          href="/login"
        >
          Ir a iniciar sesion
        </Link>
      </div>
    </section>
  );
}
