"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Gift, MessageSquare, Wallet } from "lucide-react";
import { Button } from "@/components/Button";

/** Price billed per WhatsApp template message, in ARS. */
const UNIT_PRICE_ARS = 15;
/** Free credits granted to every new local. */
const WELCOME_CREDITS = 5;
/** Accumulated credit purchases that unlock postpaid ("a mes vencido"), in ARS. */
const POSTPAID_THRESHOLD_ARS = 2000;

/**
 * Step 2 of the signup wizard: informational credits step.
 *
 * Every SabTurno tool is free. The only metered resource is the WhatsApp
 * template message. This screen sells nothing and never starts a checkout;
 * it only explains the model and lets the owner move on to step 3.
 */
export default function OnboardingSubscriptionPage() {
  const router = useRouter();

  function handleContinue() {
    router.push("/local/onboarding/hours");
  }

  const threshold = POSTPAID_THRESHOLD_ARS.toLocaleString("es-AR");

  const items = [
    {
      icon: Gift,
      title: `${WELCOME_CREDITS} créditos de bienvenida`,
      body: "Cada local empieza con mensajes de WhatsApp sin costo para probar los recordatorios.",
    },
    {
      icon: MessageSquare,
      title: `$${UNIT_PRICE_ARS} por mensaje`,
      body: "Solo pagás los mensajes de WhatsApp que se envían. Cargás créditos por adelantado cuando los necesites.",
    },
    {
      icon: Coins,
      title: "Pago a mes vencido",
      body: `Al acumular $${threshold} en compras de créditos, podés enviar hasta 200 mensajes y abonarlos a mes vencido.`,
    },
  ];

  return (
    <section className="grid gap-6 max-w-2xl mx-auto min-w-0">
      <header className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Paso 2 de 3
        </p>
        <h2 className="text-2xl font-bold text-foreground mt-1">
          Todo SabTurno es gratis
        </h2>
        <p className="text-muted-foreground mt-2">
          Todas las herramientas de la plataforma están{" "}
          <strong className="text-foreground">incluidas sin costo</strong>. Lo
          único que se cobra son los mensajes de WhatsApp.
        </p>
      </header>

      <ul className="grid gap-3">
        {items.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 min-w-0"
          >
            <Icon className="size-5 shrink-0 mt-0.5 text-primary" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/local/premium"
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Wallet className="size-4 shrink-0" />
          Ver mi billetera de créditos
        </Link>
        <Button onClick={handleContinue}>
          Continuar
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}
