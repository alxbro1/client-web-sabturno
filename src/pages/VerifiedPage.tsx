import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { LogoMark } from "@/components/Logo";

export function VerifiedPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  const isSuccess = status === "success";

  return (
    <section className="w-full max-w-140 rounded-[24px] border border-white/10 bg-[#0d0f12]/94 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-[10px] p-7 sm:p-8 flex flex-col gap-6 min-w-0">
      <div className="grid gap-4 text-center">
        <div className="mx-auto px-5 py-3">
          <LogoMark className="h-10 w-auto" />
        </div>
        <div className="grid gap-2">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#00f068]">Verificacion</p>
          <h2 className="text-[1.7rem] leading-none">
            {isSuccess ? "Cuenta verificada" : "Error de verificacion"}
          </h2>
        </div>
      </div>

      {isSuccess ? (
        <div className="rounded-2xl px-4 py-[0.95rem] border border-emerald-300/35 bg-emerald-950/30 text-emerald-100">
          Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesion.
        </div>
      ) : (
        <div className="rounded-2xl px-4 py-[0.95rem] border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] text-[#ffd6df]">
          No se pudo verificar tu cuenta. El enlace puede haber expirado o ser invalido.
        </div>
      )}

      <Link to="/login">
        <Button fullWidth>
          Ir a iniciar sesion
        </Button>
      </Link>

      <div className="grid gap-3 pt-1 text-center sm:text-left">
        <Link
          className="text-[#7bcfff] text-[0.95rem] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72"
          to="/register"
        >
          Crear una cuenta
        </Link>
        <a
          className="text-[#7bcfff] text-[0.95rem] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem] transition-[color,text-decoration-color] duration-150 hover:text-[#a8dfff] hover:decoration-[#a8dfff]/72"
          href="https://sabturno.com/politica-de-privacidad.html"
          target="_blank"
          rel="noreferrer"
        >
          Politica de privacidad
        </a>
      </div>
    </section>
  );
}
