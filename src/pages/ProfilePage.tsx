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
      <header className="flex justify-between gap-6 items-center p-8 rounded-[28px] bg-[linear-gradient(135deg,rgba(249,115,22,0.18),rgba(34,211,238,0.08)),rgba(10,22,35,0.9)] max-sm:flex-col max-sm:items-stretch">
        <div className="w-24 h-24 rounded-full overflow-hidden grid place-items-center text-[2rem] bg-gradient-to-br from-orange-500 to-cyan-400 text-white shrink-0">
          {user?.imageProfile ? <img src={user.imageProfile} alt={user.name} /> : <span>{user?.name?.charAt(0) || "S"}</span>}
        </div>
        <div>
          <p className="eyebrow">Perfil</p>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Link className="surface transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-orange-500/45" to="/profile/edit">
          <p className="eyebrow">Cuenta</p>
          <h3>Editar perfil</h3>
          <p>Actualiza nombre, email, telefono e imagen.</p>
        </Link>
        <Link className="surface transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-orange-500/45" to="/appointments">
          <p className="eyebrow">Turnos</p>
          <h3>Mis reservas</h3>
          <p>Consulta proximos turnos y tu historial.</p>
        </Link>
        <Link className="surface transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-orange-500/45" to="/profile/payments">
          <p className="eyebrow">Pagos</p>
          <h3>Historial de pagos</h3>
          <p>Consulta referencias y estados de cobro.</p>
        </Link>
        <a className="surface transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-orange-500/45" href="https://sabturno.com/terminos-y-condiciones.html" target="_blank" rel="noreferrer">
          <p className="eyebrow">Legal</p>
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