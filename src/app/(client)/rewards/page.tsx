"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarPlus, Gift, History, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StampCard } from "@/components/loyalty/StampCard";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { buildUserRewardBookingPath } from "@/lib/utils/bookingQuery";
import { isRewardUsable } from "@/lib/utils/loyalty";
import { loyaltyService } from "@/services/loyalty";
import type { LoyaltyReward } from "@/lib/types/loyalty";

export default function RewardsPage() {
  const { user } = useAuth();
  const { data: cards = [], isLoading, error } = useQuery({
    queryKey: queryKeys.loyaltyMyCards(),
    queryFn: () => loyaltyService.getMyCards(),
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando recompensas...</div>;
  }

  if (error) {
    return <div className="text-destructive">No se pudieron cargar tus recompensas.</div>;
  }

  // Una tarjeta vencida o archivada no puede canjear: mostrarla con CTA sería mentir.
  const activeCards = cards.filter((card) => card.status === "ACTIVE");

  return (
    <section className="grid gap-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Fidelidad
        </p>
        <h1 className="text-2xl font-bold text-foreground">Mis recompensas</h1>
        <p className="text-muted-foreground">
          Consultá tus tarjetas, sellos disponibles y beneficios generados.
        </p>
      </header>

      {activeCards.length === 0 ? (
        <Card className="grid gap-2 p-6">
          <Gift className="size-8 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">
            Todavía no tenés tarjetas activas
          </h2>
          <p className="text-sm text-muted-foreground">
            Cuando completes turnos en locales con fidelidad, vas a ver tu progreso acá.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {activeCards.map((card) => {
            const usableRewards = card.rewards.filter((reward) =>
              isRewardUsable(reward),
            );
            const everyRewardHasService = usableRewards.every(
              (reward) => reward.serviceId,
            );
            const localId = card.local?.id || card.localId;

            return (
              <div key={card.id} className="grid grid-cols-1 gap-4">
                {/* Va antes de la tarjeta (y no en su `footer`, que queda debajo
                    del botón) porque el problema es justamente que el cliente no
                    se entera: el anuncio tiene que ser lo primero que lee. */}
                {usableRewards.length > 0 ? (
                  <section
                    aria-labelledby={`benefit-ready-${card.id}`}
                    className="grid grid-cols-1 gap-2 rounded-xl border border-primary/25 bg-primary/[0.07] p-4"
                  >
                    <h2
                      id={`benefit-ready-${card.id}`}
                      className="flex items-center gap-2 text-base font-bold text-foreground"
                    >
                      <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      {usableRewards.length === 1
                        ? "Tenés un beneficio para usar"
                        : `Tenés ${usableRewards.length} beneficios para usar`}
                    </h2>
                    <ol className="grid list-decimal gap-1 pl-5 text-sm text-muted-foreground">
                      <li>Tocá «Usar este beneficio».</li>
                      <li>
                        {everyRewardHasService
                          ? "Elegí día y horario."
                          : "Elegí el servicio, el día y el horario."}
                      </li>
                      <li>Vas a ver el descuento aplicado antes de confirmar.</li>
                    </ol>
                  </section>
                ) : null}

                <StampCard
                  card={card}
                  timezone={user?.timezone}
                  renderRewardAction={(reward: LoyaltyReward) => (
                    <Link
                      href={buildUserRewardBookingPath(reward, localId)}
                      className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <CalendarPlus className="size-4" aria-hidden="true" />
                      Usar este beneficio
                    </Link>
                  )}
                />

                <Card className="grid gap-2 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <History className="size-4 text-primary" aria-hidden="true" />
                    Últimos movimientos
                  </div>
                  {card.movements?.length ? (
                    <div className="grid gap-2">
                      {card.movements.slice(0, 5).map((movement) => (
                        <div key={movement.id} className="text-sm text-muted-foreground">
                          {movement.stamps > 0 ? "+" : ""}
                          {movement.stamps} sellos · saldo {movement.balanceAfter}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
