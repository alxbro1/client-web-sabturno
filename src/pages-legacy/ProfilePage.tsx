import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/stores/auth";
import { userProfileService } from "@/services/userProfile";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  async function handleDeleteAccount() {
    if (!user?.id) {
      return;
    }

    const shouldDelete = window.confirm(
      "Esta accion eliminara tu cuenta, tus reservas y configuraciones. Deseas continuar?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await userProfileService.deleteAccount(user.id);
      logout();
      navigate("/login", { replace: true });
    } catch {
      window.alert("No se pudo eliminar la cuenta.");
    }
  }

  return (
    <section className="grid gap-6">
      <header className="rounded-[28px] border border-white/12 bg-[radial-gradient(circle_at_0%_0%,rgba(0,240,104,0.18),transparent_42%),linear-gradient(180deg,rgba(20,20,20,0.98),rgba(11,11,11,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.34)] flex justify-between gap-6 items-center p-8 max-sm:flex-col max-sm:items-stretch">
        <div className="w-24 h-24 rounded-full overflow-hidden grid place-items-center text-[2rem] bg-gradient-to-br from-[#6bffb0] to-[#00f068] text-[#02180d] shrink-0 border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
          {user?.imageProfile ? <img src={user.imageProfile} alt={user.name} /> : <span>{user?.name?.charAt(0) || "S"}</span>}
        </div>
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Perfil</p>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Link className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45" to="/profile/edit">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Cuenta</p>
          <h3>Editar perfil</h3>
          <p>Actualiza nombre, email, telefono e imagen.</p>
        </Link>
        <Link className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45" to="/appointments">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Turnos</p>
          <h3>Mis reservas</h3>
          <p>Consulta proximos turnos y tu historial.</p>
        </Link>
        <Link className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45" to="/profile/payments">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Pagos</p>
          <h3>Historial de pagos</h3>
          <p>Consulta referencias y estados de cobro.</p>
        </Link>
        <a className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45" href="https://sabturno.com/terminos-y-condiciones.html" target="_blank" rel="noreferrer">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Legal</p>
          <h3>Terminos y condiciones</h3>
          <p>Abre la version publica publicada por SabTurno.</p>
        </a>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          Cerrar sesion
        </Button>
        <Button variant="danger" onClick={handleDeleteAccount}>
          Eliminar cuenta
        </Button>
      </div>
    </section>
  );
}