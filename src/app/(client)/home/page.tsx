"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/stores/auth";

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <section className="grid gap-6">
      <header className="rounded-[28px] border border-white/12 bg-[radial-gradient(circle_at_0%_0%,rgba(0,240,104,0.18),transparent_42%),linear-gradient(180deg,rgba(20,20,20,0.98),rgba(11,11,11,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.34)] flex justify-between gap-6 items-end p-8 max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Inicio
          </p>
          <h2>Bienvenido, {user?.name || "cliente"}</h2>
          <p>
            Desde aca puedes reservar turnos, revisar pagos y editar tu perfil
            sin salir del navegador.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Link href="/booking/select-local">
            <Button>Reservar turno</Button>
          </Link>
          <Link href="/appointments">
            <Button variant="secondary">Mis turnos</Button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Link
          className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45"
          href="/booking/select-local"
        >
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Reserva
          </p>
          <h3>Seleccionar local</h3>
          <p>Explora peluquerias activas y elige donde reservar.</p>
        </Link>
        <Link
          className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 transition-[transform,border-color,background-color] duration-[140ms] hover:-translate-y-0.5 hover:border-[#00f068]/45"
          href="/payments"
        >
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Pagos
          </p>
          <h3>Historial de pagos</h3>
          <p>Consulta estados, referencias y montos abonados.</p>
        </Link>
      </section>
    </section>
  );
}
