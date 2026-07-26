"use client";

import { useQuery } from "@tanstack/react-query";
import { Gift, Ticket, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { queryKeys } from "@/lib/queryKeys";
import { loyaltyService } from "@/services/loyalty";
import type { LoyaltyReward } from "@/lib/types/loyalty";

function rewardLabel(reward: LoyaltyReward) {
  if (reward.type === "FREE_SERVICE") return "Servicio gratis";
  if (reward.type === "PERCENTAGE_DISCOUNT") return `${Number(reward.value || 0)}% de descuento`;
  return `$${Number(reward.value || 0).toFixed(2)} de descuento`;
}

export default function RewardsPage() {
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

  return (
    <section className="grid gap-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Fidelidad
        </p>
        <h1 className="text-2xl font-bold text-foreground">Mis recompensas</h1>
        <p className="text-muted-foreground">
          Consulta tus tarjetas, sellos disponibles y beneficios generados.
        </p>
      </header>

      {cards.length === 0 ? (
        <Card className="grid gap-2 p-6">
          <Gift className="size-8 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Todavia no tenes tarjetas activas
          </h2>
          <p className="text-sm text-muted-foreground">
            Cuando completes turnos en locales con fidelidad, vas a ver tu progreso aca.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cards.map((card) => {
            const required = card.revision.stampsRequired;
            const progress = Math.min(100, (card.stampsBalance / required) * 100);
            const availableRewards = card.rewards.filter(
              (reward) => reward.status === "AVAILABLE",
            );

            return (
              <Card key={card.id} className="grid gap-5 p-5">
                <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {card.local?.name || card.program.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {card.program.name} · {card.stampsBalance}/{required} sellos
                    </p>
                  </div>
                  {card.expiresAt ? (
                    <span className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground">
                      Vence {new Date(card.expiresAt).toLocaleDateString("es-AR")}
                    </span>
                  ) : null}
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Ticket className="size-4 text-primary" />
                      Beneficios disponibles
                    </div>
                    {availableRewards.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin beneficios disponibles.</p>
                    ) : (
                      <div className="grid gap-2">
                        {availableRewards.map((reward) => (
                          <div key={reward.id} className="text-sm text-muted-foreground">
                            <span className="text-foreground">{rewardLabel(reward)}</span>
                            {reward.expiresAt
                              ? ` · vence ${new Date(reward.expiresAt).toLocaleDateString("es-AR")}`
                              : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <History className="size-4 text-primary" />
                      Ultimos movimientos
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
                      <p className="text-sm text-muted-foreground">Sin movimientos todavia.</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
