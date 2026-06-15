import { Link } from "react-router-dom";
import { Button } from "@/components/Button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <section className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 grid gap-4">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">404</p>
        <h2>La pagina no existe</h2>
        <p>Puede que el enlace haya cambiado o que la ruta sea solo valida dentro de la app movil.</p>
        <Link to="/home">
          <Button>Volver al inicio</Button>
        </Link>
      </section>
    </div>
  );
}