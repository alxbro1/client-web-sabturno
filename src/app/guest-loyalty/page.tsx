"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarPlus,
  Gift,
  LockKeyhole,
  Mail,
  MessageCircle,
  Sparkles,
  Stamp,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/ui/card";
import { StampCard } from "@/components/loyalty/StampCard";
import { buildLocalBookingPath } from "@/lib/utils/bookingQuery";
import { loyaltyService } from "@/services/loyalty";

function PageIntro() {
  return (
    <header className="grid max-w-2xl gap-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
        <Sparkles className="size-4" aria-hidden="true" />
        Tus visitas tienen premio
      </div>
      <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-5xl">
        Volvé, sumá sellos y disfrutá tu recompensa.
      </h1>
      <p className="max-w-xl text-base leading-7 text-muted-foreground">
        Cada vez que completás un turno en un local adherido, avanzás un casillero.
        Consultá acá tu progreso y los beneficios que ya podés usar.
      </p>
    </header>
  );
}

export default function GuestLoyaltyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [localId, setLocalId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"phone" | "email">("phone");
  const phoneDigits = phone.replace(/\D/g, "");
  const recipientIsValid = channel === "email" ? email.includes("@") : phoneDigits.length >= 10;

  const verifyQuery = useQuery({
    queryKey: ["guest-loyalty", token],
    queryFn: () => loyaltyService.verifyGuestLink(token),
    enabled: !!token,
    retry: false,
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      loyaltyService.requestGuestLink(
        localId,
        channel === "email" ? { email: email.trim() } : { phone: phone.trim() },
      ),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    requestMutation.mutate();
  }

  if (token) {
    const cards = verifyQuery.data?.cards || [];
    return (
      <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16">
        <section className="mx-auto grid max-w-4xl grid-cols-1 gap-10">
          <PageIntro />

          {verifyQuery.isLoading ? (
            <Card className="items-center border-white/10 p-8 text-center">
              <Stamp className="size-8 animate-pulse text-primary" />
              <p className="text-muted-foreground">Estamos preparando tu tarjeta...</p>
            </Card>
          ) : verifyQuery.error ? (
            <Card className="items-center border-destructive/30 p-8 text-center">
              <LockKeyhole className="size-8 text-destructive" />
              <div className="grid grid-cols-1 gap-3">
                <h2 className="text-lg font-bold text-foreground">Este enlace ya no funciona</h2>
                <p className="text-sm text-muted-foreground">
                  Puede haber vencido o ya fue utilizado. Pedí uno nuevo para
                  volver a ver tus sellos.
                </p>
                {/* El formulario para pedir otro enlace ya vive en esta misma
                    ruta sin `?token`: alcanza con sacar el token. */}
                <Link href="/guest-loyalty" className="justify-self-center">
                  <Button>
                    Pedir un enlace nuevo
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </Card>
          ) : cards.length === 0 ? (
            <Card className="items-center border-white/10 p-8 text-center">
              <Gift className="size-8 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-foreground">Tu primera tarjeta te está esperando</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuando completes un turno en este local, tus sellos y beneficios aparecerán acá.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {cards.map((card) => (
                <StampCard
                  key={card.id}
                  card={card}
                  footer={
                    // El objetivo entero de la tarjeta es que el cliente vuelva:
                    // sin este CTA le decimos "te faltan N sellos" y lo dejamos
                    // sin forma de sacar el proximo turno.
                    <Link
                      href={buildLocalBookingPath(card.local?.id || card.localId)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <CalendarPlus className="size-4" aria-hidden="true" />
                      Reservar mi próximo turno
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16">
      <section className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-8">
          <PageIntro />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["1", "Completá tu turno"],
              ["2", "Recibí tus sellos"],
              ["3", "Usá tu beneficio"],
            ].map(([step, label]) => (
              <div key={step} className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
                  {step}
                </span>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="relative overflow-hidden border-white/15 bg-[#111512] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)] sm:p-8">
          <div aria-hidden="true" className="absolute -right-16 -top-20 size-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative grid gap-6">
            <div className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
              {channel === "phone" ? (
                <MessageCircle className="size-5" aria-hidden="true" />
              ) : (
                <Mail className="size-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Mirá tu tarjeta</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ingresá los datos con los que reservaste. Te enviaremos un enlace seguro
                para ver tus sellos y recompensas.
              </p>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-semibold text-foreground">
                  ¿Dónde querés recibir el enlace?
                </legend>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/25 p-1">
                  {(["phone", "email"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={channel === option}
                      onClick={() => {
                        setChannel(option);
                        requestMutation.reset();
                      }}
                      className={`h-10 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        channel === option
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option === "phone" ? "WhatsApp" : "Email"}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                Local
                <input
                  className="h-12 rounded-xl border border-input bg-black/25 px-4 text-sm text-foreground outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/15"
                  value={localId}
                  onChange={(event) => setLocalId(event.target.value)}
                  placeholder="ID del local"
                  autoComplete="off"
                  required
                />
              </label>
              {channel === "phone" ? (
                <label className="grid gap-2 text-sm font-semibold text-foreground">
                  Teléfono
                  <input
                    className="h-12 rounded-xl border border-input bg-black/25 px-4 text-sm text-foreground outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/15"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="351 555 1234"
                    autoComplete="tel"
                    required
                  />
                </label>
              ) : (
                <label className="grid gap-2 text-sm font-semibold text-foreground">
                  Email
                  <input
                    className="h-12 rounded-xl border border-input bg-black/25 px-4 text-sm text-foreground outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/15"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </label>
              )}
              <Button
                className="mt-1 h-12 justify-between"
                type="submit"
                disabled={!localId || !recipientIsValid || requestMutation.isPending}
              >
                {requestMutation.isPending ? "Enviando..." : "Enviar enlace seguro"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              {requestMutation.isSuccess ? (
                <p className="rounded-xl border border-primary/20 bg-primary/[0.07] p-3 text-sm text-foreground">
                  Si los datos coinciden con una tarjeta, vas a recibir un enlace seguro en unos minutos.
                </p>
              ) : null}
              {requestMutation.isError ? (
                <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
                  No pudimos enviar el enlace. Revisá los datos e intentá nuevamente.
                </p>
              ) : null}
            </form>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              El enlace es personal y vence por seguridad.
            </p>
          </div>
        </Card>
      </section>
    </main>
  );
}
