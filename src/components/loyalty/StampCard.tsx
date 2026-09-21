"use client";

import type { ReactNode } from "react";
import { Check, CalendarClock, Gift, PartyPopper, Sparkles, Stamp, Ticket } from "lucide-react";
import type { LoyaltyCard } from "@/lib/types/loyalty";
import { availableRewardLabel, benefitSentence } from "@/lib/utils/loyalty";
import { formatLocalDate } from "@/lib/utils/date";

/**
 * La tarjeta de sellos tal cual la ve el cliente.
 *
 * La consumen dos pantallas: `/guest-loyalty` (el cliente, con datos reales) y
 * `/local/loyalty` (el dueño, como preview en vivo del form). Por eso recibe
 * una `LoyaltyCard` completa y no props sueltas: el preview arma una tarjeta
 * sintética con los valores del form y ve exactamente el mismo render.
 */
export function StampCard({
  card,
  footer,
  timezone,
}: {
  card: LoyaltyCard;
  /** Slot para el CTA de reserva; el preview del dueño lo deja vacío. */
  footer?: ReactNode;
  timezone?: string;
}) {
  const required = Math.max(card.revision.stampsRequired, 1);
  const completed = Math.min(card.stampsBalance, required);
  const remaining = Math.max(required - completed, 0);
  const availableRewards = card.rewards.filter(
    (reward) => reward.status === "AVAILABLE",
  );
  const localName = card.local?.name || card.program.name;
  // El nombre por defecto del programa es literalmente "Tarjeta de fidelidad",
  // que ya está en el encabezado: mostrarlo otra vez es ruido.
  const showProgramName =
    card.program.name !== localName &&
    card.program.name.toLowerCase() !== "tarjeta de fidelidad";

  const cardExpiry = card.expiresAt
    ? formatLocalDate(card.expiresAt, timezone, "d 'de' MMMM 'de' yyyy")
    : null;

  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#111512] shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/12 blur-3xl"
      />

      <div className="relative grid grid-cols-1 gap-7 p-5 sm:p-8">
        <header className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Stamp className="size-4" aria-hidden="true" />
              Tarjeta de fidelidad
            </div>
            <h2 className="truncate text-2xl font-bold text-foreground sm:text-3xl">
              {localName}
            </h2>
            {showProgramName ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {card.program.name}
              </p>
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
                        : "border-dashed border-white/20 bg-white/[0.03] text-muted-foreground/70",
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
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

        <div className="grid grid-cols-1 gap-3 rounded-2xl bg-primary px-5 py-4 text-primary-foreground sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="grid size-11 place-items-center rounded-full bg-black/15">
            <PartyPopper className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/65">
              Tu beneficio
            </p>
            <p className="text-lg font-bold text-primary-foreground">
              {benefitSentence(
                required,
                card.revision.rewardType,
                card.revision.rewardValue,
              )}
            </p>
          </div>
        </div>

        {card.program.description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {card.program.description}
          </p>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Cada turno completado suma sellos automáticamente. Cuando llenes la
            tarjeta, tu beneficio quedará disponible para usar en una próxima
            reserva.
          </p>
        )}

        {availableRewards.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Ticket className="size-4 text-primary" aria-hidden="true" />
              {availableRewards.length === 1
                ? "Tenés un beneficio listo para usar"
                : `Tenés ${availableRewards.length} beneficios listos para usar`}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {availableRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="grid grid-cols-1 gap-1 rounded-xl border border-primary/25 bg-primary/[0.07] p-3"
                >
                  <span className="flex items-center gap-3 text-sm font-semibold text-foreground">
                    <Sparkles
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {availableRewardLabel(reward)}
                  </span>
                  {reward.expiresAt ? (
                    <span className="pl-7 text-xs text-muted-foreground">
                      Válido hasta el{" "}
                      {formatLocalDate(
                        reward.expiresAt,
                        timezone,
                        "d 'de' MMMM 'de' yyyy",
                      )}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {cardExpiry ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
            Tu tarjeta vence el {cardExpiry}.
          </p>
        ) : null}

        {footer}
      </div>
    </article>
  );
}
