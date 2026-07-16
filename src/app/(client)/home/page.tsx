"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <section className="grid gap-6">
      <header className="bg-gradient-to-b from-primary/[0.06] to-transparent bg-card border border-border shadow-sm rounded-xl flex justify-between gap-6 items-end p-8 max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Inicio
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            Bienvenido, {user?.name || "cliente"}
          </h2>
          <p className="text-muted-foreground mt-1">
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
        <Link href="/booking/select-local">
          <Card className="p-5 transition-[transform,border-color] duration-[140ms] hover:-translate-y-0.5 hover:border-primary/40">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Reserva
            </p>
            <h3 className="text-lg font-semibold mt-1">Seleccionar local</h3>
            <p className="text-sm text-muted-foreground">
              Explora peluquerias activas y elige donde reservar.
            </p>
          </Card>
        </Link>
        <Link href="/payments">
          <Card className="p-5 transition-[transform,border-color] duration-[140px] hover:-translate-y-0.5 hover:border-primary/40">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Pagos
            </p>
            <h3 className="text-lg font-semibold mt-1">Historial de pagos</h3>
            <p className="text-sm text-muted-foreground">
              Consulta estados, referencias y montos abonados.
            </p>
          </Card>
        </Link>
      </section>
    </section>
  );
}
