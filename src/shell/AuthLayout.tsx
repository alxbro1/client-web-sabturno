import { Navigate, Outlet } from "react-router-dom";
import { LogoMark } from "@/components/Logo";
import { useAuthStore } from "@/stores/auth";

export function AuthLayout() {
  const { token, user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
        Cargando...
      </div>
    );
  }

  if (token && !user?.isLocal) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen grid place-items-center p-8 max-sm:p-4">
      <div className="w-full max-w-[1120px] p-[1.2rem] border border-white/10 bg-[rgba(10,10,10,0.9)] rounded-[28px] shadow-[0_26px_75px_rgba(0,0,0,0.4)] backdrop-blur-md grid grid-cols-[1.1fr_0.9fr] gap-[1.2rem] max-lg:grid-cols-1">
        <section className="rounded-[28px] border border-white/12 bg-[radial-gradient(circle_at_0%_0%,rgba(0,240,104,0.18),transparent_42%),linear-gradient(180deg,rgba(20,20,20,0.98),rgba(11,11,11,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.34)] flex flex-col justify-between min-h-[620px] p-8 max-lg:min-h-0 max-sm:p-[1.2rem]">
          <div className="flex items-center w-full h-full">
            <LogoMark className="h-full" />
          </div>
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Panel Cliente</p>
            <p className="max-w-[34ch]">
              Reserva turnos, gestiona pagos y consulta tu historial en una sola plataforma.
            </p>
          </div>
        </section>
        <Outlet />
      </div>
    </div>
  );
}