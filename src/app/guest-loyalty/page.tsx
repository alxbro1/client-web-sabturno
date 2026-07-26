"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  Gift,
  LockKeyhole,
  Mail,
  PartyPopper,
  Sparkles,
  Stamp,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/ui/card";
import type { LoyaltyCard, LoyaltyReward, LoyaltyRewardType } from "@/lib/types/loyalty";
import { loyaltyService } from "@/services/loyalty";

function rewardLabel(type: LoyaltyRewardType, value?: string | number | null) {
  if (type === "FREE_SERVICE") return "un servicio gratis";
  if (type === "PERCENTAGE_DISCOUNT") return `${Number(value || 0)}% de descuento`;
  return `$${Number(value || 0).toFixed(2)} de descuento`;
}

function availableRewardLabel(reward: LoyaltyReward) {
  if (reward.type === "FREE_SERVICE" && reward.service?.name) {
    return `${reward.service.name} gratis`;
  }
  return rewardLabel(reward.type, reward.value);
}

function StampCard({ card }: { card: LoyaltyCard }) {
  const required = Math.max(card.revision.stampsRequired, 1);
  const completed = Math.min(card.stampsBalance, required);
  const remaining = Math.max(required - completed, 0);
  const availableRewards = card.rewards.filter((reward) => reward.status === "AVAILABLE");
  const benefit = rewardLabel(card.revision.rewardType, card.revision.rewardValue);
  const localName = card.local?.name || card.program.name;

  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#111512] shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/12 blur-3xl"
      />

      <div className="relative grid gap-7 p-5 sm:p-8">
        <header className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Stamp className="size-4" aria-hidden="true" />
              Tarjeta de fidelidad
            </div>
            <h2 className="truncate text-2xl font-bold text-foreground sm:text-3xl">
              {localName}
            </h2>
            {card.program.name !== localName ? (
              <p className="mt-1 text-sm text-muted-foreground">{card.program.name}</p>
            ) : null}
          </div>
          <div className="grid size-12 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <Gift className="size-6" aria-hidden="true" />
          </div>
        </header>

        <div className="relative rounded-2xl border border-dashed border-white/20 bg-black/25 p-4 sm:p-6">
          <span
            aria-hidden="true"
            className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full border-r border-white/15 bg-[#080908]"
          />
          <span
            aria-hidden="true"
            className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full border-l border-white/15 bg-[#080908]"
          />

          <div
            className="grid grid-cols-[repeat(auto-fit,minmax(3.25rem,1fr))] gap-3"
            aria-label={`${completed} de ${required} sellos completados`}
          >
            {Array.from({ length: required }, (_, index) => {
              const isCompleted = index < completed;
              return (
                <div key={index} className="grid justify-items-center gap-2">
                  <div
                    className={[
                      "grid aspect-square w-full max-w-16 place-items-center rounded-full border-2 transition-transform",
                      isCompleted
                        ? "rotate-[-5deg] border-primary bg-primary text-primary-foreground shadow-[0_0_24px_rgba(0,240,104,0.25)]"
                        : "border-dashed border-white/20 bg-white/[0.03] text-white/25",
                    ].join(" ")}
                  >
                    {isCompleted ? (
                      <Check className="size-6 stroke-[3]" aria-hidden="true" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                    <span className="sr-only">
                      Sello {index + 1}: {isCompleted ? "completado" : "pendiente"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-foreground">
              {remaining === 0
                ? "¡Completaste tu tarjeta!"
                : `Te ${remaining === 1 ? "falta" : "faltan"} ${remaining} ${
                    remaining === 1 ? "sello" : "sellos"
                  }`}
            </p>
            <span className="text-xs font-bold tabular-nums text-primary">
              {completed} / {required}
            </span>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-primary px-5 py-4 text-primary-foreground sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="grid size-11 place-items-center rounded-full bg-black/15">
            <PartyPopper className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/65">
              Tu beneficio
            </p>
            <p className="text-lg font-bold text-primary-foreground">
              Al completar {required} sellos, ganás {benefit}.
            </p>
          </div>
        </div>

        {card.program.description ? (
          <p className="text-sm leading-6 text-muted-foreground">{card.program.description}</p>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Cada turno completado suma sellos automáticamente. Cuando llenes la tarjeta,
            tu beneficio quedará disponible para usar en una próxima reserva.
          </p>
        )}

        {availableRewards.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Ticket className="size-4 text-primary" aria-hidden="true" />
              {availableRewards.length === 1
                ? "Tenés un beneficio listo para usar"
                : `Tenés ${availableRewards.length} beneficios listos para usar`}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {availableRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.07] p-3"
                >
                  <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold text-foreground">
                    {availableRewardLabel(reward)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

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

  const verifyQuery = useQuery({
    queryKey: ["guest-loyalty", token],
    queryFn: () => loyaltyService.verifyGuestLink(token),
    enabled: !!token,
    retry: false,
  });

  const requestMutation = useMutation({
    mutationFn: () => loyaltyService.requestGuestLink(localId, email),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    requestMutation.mutate();
  }

  if (token) {
    const cards = verifyQuery.data?.cards || [];
    return (
      <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16">
        <section className="mx-auto grid max-w-4xl gap-10">
          <PageIntro />

          {verifyQuery.isLoading ? (
            <Card className="items-center border-white/10 p-8 text-center">
              <Stamp className="size-8 animate-pulse text-primary" />
              <p className="text-muted-foreground">Estamos preparando tu tarjeta...</p>
            </Card>
          ) : verifyQuery.error ? (
            <Card className="items-center border-destructive/30 p-8 text-center">
              <LockKeyhole className="size-8 text-destructive" />
              <div>
                <h2 className="text-lg font-bold text-foreground">Este enlace ya no funciona</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Puede haber vencido o ya fue utilizado. Solicitá uno nuevo para consultar tus sellos.
                </p>
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
            <div className="grid gap-6">
              {cards.map((card) => (
                <StampCard key={card.id} card={card} />
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
              <Mail className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Mirá tu tarjeta</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ingresá los datos con los que reservaste. Te enviaremos un enlace seguro
                para ver tus sellos y recompensas.
              </p>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
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
              <Button
                className="mt-1 h-12 justify-between"
                type="submit"
                disabled={!localId || !email || requestMutation.isPending}
              >
                {requestMutation.isPending ? "Enviando..." : "Enviar enlace seguro"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              {requestMutation.isSuccess ? (
                <p className="rounded-xl border border-primary/20 bg-primary/[0.07] p-3 text-sm text-foreground">
                  Revisá tu email. Si tenés una tarjeta asociada, el enlace llegará en unos minutos.
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
