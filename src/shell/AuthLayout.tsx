import { Navigate, Outlet } from "react-router-dom";
import { LogoMark } from "@/components/Logo";
import { useAuthStore } from "@/stores/auth";

export function AuthLayout() {
  const { token, user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#aab8c9]">
        Cargando...
      </div>
    );
  }

  if (token && !user?.isLocal) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen grid place-items-center p-8 max-sm:p-4">
      <div className="w-full max-w-[1120px] p-[1.2rem] border border-[#00f068]/18 bg-[rgba(10,10,10,0.9)] rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.38)] grid grid-cols-[1.1fr_0.9fr] gap-[1.2rem] max-lg:grid-cols-1">
        <section className="flex flex-col justify-between min-h-[620px] p-8 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(0,240,104,0.16),transparent_30%),linear-gradient(180deg,rgba(10,10,10,0.94),rgba(5,5,5,0.98))] max-lg:min-h-0 max-sm:p-[1.2rem]">
          <div className="flex items-center gap-3">
            <LogoMark />
          </div>
          <div>
            <p className="eyebrow">Panel Cliente</p>
            <h1>Tu compañero de turnos</h1>
            <p>
              Reserva turnos, gestiona pagos y consulta tu historial en una sola plataforma.
            </p>
          </div>
        </section>
        <Outlet />
      </div>
    </div>
  );
}