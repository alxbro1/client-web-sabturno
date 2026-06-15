"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/stores/auth";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).catch(console.error);
    logout();
    router.replace("/login");
  }

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
          Perfil
        </p>
        <h2>Mi perfil</h2>
      </div>

      <div className="grid gap-4">
        <div className="p-4 rounded-[18px] border border-white/10 bg-white/[0.02]">
          <p className="text-white/48 text-sm">Nombre</p>
          <p className="font-semibold">{user?.name || "No disponible"}</p>
        </div>
        <div className="p-4 rounded-[18px] border border-white/10 bg-white/[0.02]">
          <p className="text-white/48 text-sm">Email</p>
          <p className="font-semibold">{user?.email || "No disponible"}</p>
        </div>
      </div>

      <div className="grid gap-3">
        <Link href="/profile/edit">
          <Button variant="secondary" fullWidth>
            Editar perfil
          </Button>
        </Link>
        <Button variant="ghost" onClick={handleLogout} fullWidth>
          Cerrar sesion
        </Button>
      </div>
    </section>
  );
}
