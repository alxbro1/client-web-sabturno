import { useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { LogoMark, LogoText } from "@/components/Logo";
import { IconHome, IconCalendar, IconUser, IconLogout, IconPayment } from "@/components/Icons";
import { useAuthStore } from "@/stores/auth";

export function ProtectedShell() {
  const { token, user, hasHydrated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/login", { replace: true });
  }

  function handleMobileNavigation() {
    setIsMobileMenuOpen(false);
  }

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#aab8c9]">
        Cargando...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.isLocal) {
    return (
        <div className="min-h-screen grid place-items-center p-8 max-sm:p-4">
          <section className="surface grid gap-4">
          <p className="eyebrow">Acceso restringido</p>
          <h2>Esta web es solo para clientes</h2>
          <p>Tu cuenta corresponde a un local. Usa la app actual para la administracion del negocio.</p>
          <Button
            onClick={handleLogout}
          >
            Volver al login
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[300px_1fr] gap-5 min-h-screen p-5 max-lg:grid-cols-1 max-sm:gap-3 max-sm:p-3">
      <aside className="self-start sticky top-5 h-[calc(100vh-2.5rem)] overflow-y-auto p-6 flex flex-col gap-8 justify-between border border-[#00f068]/18 bg-[rgba(10,10,10,0.92)] rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.38)] max-sm:hidden">
        <div>
          <Link to="/home" className="flex items-center gap-2 mb-4">
            <LogoMark />
          </Link>
          <h3 className="max-w-[20rem] text-white/72">Reservas, pagos y perfil en una sola web.</h3>
        </div>

        <nav className="grid gap-3">
          <NavLink className="nav-link flex items-center gap-3" to="/home">
            <IconHome />
            <span>Inicio</span>
          </NavLink>
          <NavLink className="nav-link flex items-center gap-3" to="/booking/select-local">
            <IconCalendar />
            <span>Reservar</span>
          </NavLink>
          <NavLink className="nav-link flex items-center gap-3" to="/appointments">
            <IconCalendar />
            <span>Mis turnos</span>
          </NavLink>
          <NavLink className="nav-link flex items-center gap-3" to="/profile">
            <IconUser />
            <span>Perfil</span>
          </NavLink>
          <NavLink className="nav-link flex items-center gap-3" to="/payments">
            <IconPayment />
            <span>Ver Pagos</span>
          </NavLink>
        </nav>

        <div className="grid gap-[0.85rem]">
          <div>
            <strong>{user?.name}</strong>
            <p className="text-white/54">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="nav-link flex items-center gap-3 danger"
          >
            <IconLogout />
            <span>Cerrar sesion</span>
          </Button>
        </div>
      </aside>

      <main className="p-6 border border-[#00f068]/18 bg-[rgba(10,10,10,0.92)] rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.38)] overflow-y-auto max-sm:order-2 max-sm:p-4 max-sm:rounded-[22px]">
        <div className="hidden max-sm:flex items-center justify-between gap-3 pb-4">
          <Link to="/home" className="flex items-center gap-2">
            <LogoMark />
          </Link>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00f068]/22 bg-[#0a0a0a] text-[#00f068] shadow-[0_10px_24px_rgba(0,0,0,0.34)]"
          >
            <span className="flex h-4 w-5 flex-col justify-between">
              <span className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-150 ${isMobileMenuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 rounded-full bg-current transition-opacity duration-150 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-150 ${isMobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>

        {isMobileMenuOpen ? (
          <div className="hidden max-sm:grid gap-4 mb-4 rounded-[22px] border border-[#00f068]/18 bg-[rgba(10,10,10,0.98)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.34)]">
            <nav className="grid gap-2">
              <NavLink className="nav-link flex items-center gap-3" to="/home" onClick={handleMobileNavigation}>
                <IconHome />
                <span>Inicio</span>
              </NavLink>
              <NavLink className="nav-link flex items-center gap-3" to="/booking/select-local" onClick={handleMobileNavigation}>
                <IconCalendar />
                <span>Reservar</span>
              </NavLink>
              <NavLink className="nav-link flex items-center gap-3" to="/appointments" onClick={handleMobileNavigation}>
                <IconCalendar />
                <span>Mis turnos</span>
              </NavLink>
              <NavLink className="nav-link flex items-center gap-3" to="/profile" onClick={handleMobileNavigation}>
                <IconUser />
                <span>Perfil</span>
              </NavLink>
              <NavLink className="nav-link flex items-center gap-3" to="/payments" onClick={handleMobileNavigation}>
                <IconPayment />
                <span>Ver pagos</span>
              </NavLink>
            </nav>

            <div className="grid gap-3 border-t border-[#00f068]/12 pt-3">
              <div>
                <strong>{user?.name}</strong>
                <p className="text-white/54">{user?.email}</p>
              </div>
              <Button variant="ghost" onClick={handleLogout} className="nav-link flex items-center gap-3 danger">
                <IconLogout />
                <span>Cerrar sesion</span>
              </Button>
            </div>
          </div>
        ) : null}

        <Outlet />
      </main>
    </div>
  );
}