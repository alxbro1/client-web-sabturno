"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, CalendarDays, CreditCard } from "lucide-react";
import { Button } from "@/components/Button";
import { usePremiumStatusQuery } from "@/hooks/queries/usePremiumStatusQuery";

export default function PremiumSuccessPage() {
  const { data: status, isLoading } = usePremiumStatusQuery();

  return (
    <section className="grid gap-8 max-w-lg mx-auto text-center py-8">
      <div className="flex justify-center">
        <div className="flex items-center justify-center size-20 rounded-full bg-primary/15">
          <CheckCircle2 className="size-10 text-primary" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          ¡Suscripción activada!
        </h1>
        <p className="text-muted-foreground">
          Tu plan ya está activo. Ahora podés disfrutar de todas las
          funcionalidades incluidas.
        </p>
      </div>

      {status && !isLoading && (
        <div className="rounded-xl border border-border bg-muted/30 p-6 text-left space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
            Resumen de tu plan
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium text-foreground">{status.planName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {status.interval === "monthly"
                    ? "Facturación mensual"
                    : "Facturación anual"}
                </p>
                {status.nextBillingDate && (
                  <p className="font-medium text-foreground">
                    Próximo cobro:{" "}
                    {new Date(status.nextBillingDate).toLocaleDateString(
                      "es-AR",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Próximos pasos
        </h3>
        <ul className="text-sm text-muted-foreground text-left space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
            <span>Configurá tus métodos de cobro en la sección de pagos</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
            <span>Invitá a tus empleados a gestionar turnos</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
            <span>Compartí tu link de reservas con tus clientes</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link href="/local/dashboard">
          <Button>
            Ir al panel
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </Link>
        <Link href="/local/premium/manage">
          <Button variant="secondary">Gestionar suscripción</Button>
        </Link>
      </div>
    </section>
  );
}
