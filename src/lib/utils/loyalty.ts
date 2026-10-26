import type { LoyaltyReward, LoyaltyRewardType } from "@/lib/types/loyalty";

/**
 * Como se nombra el beneficio en una frase: "ganas {esto}".
 *
 * Vive acá y no en la pantalla del invitado porque el dueño tiene que leer
 * exactamente la misma frase mientras configura el programa. Si divergen, el
 * dueño configura una cosa y el cliente lee otra.
 */
export function rewardLabel(
  type: LoyaltyRewardType,
  value?: string | number | null,
): string {
  if (type === "FREE_SERVICE") return "un servicio gratis";
  if (type === "PERCENTAGE_DISCOUNT") return `${Number(value || 0)}% de descuento`;
  return `$${Number(value || 0).toFixed(2)} de descuento`;
}

/** Igual que `rewardLabel`, pero nombra el servicio cuando el beneficio ya se emitió. */
export function availableRewardLabel(reward: LoyaltyReward): string {
  if (reward.type === "FREE_SERVICE" && reward.service?.name) {
    return `${reward.service.name} gratis`;
  }
  return rewardLabel(reward.type, reward.value);
}

/** La frase completa que ve el cliente en su tarjeta. */
export function benefitSentence(
  stampsRequired: number,
  type: LoyaltyRewardType,
  value?: string | number | null,
): string {
  const stamps = Math.max(stampsRequired, 1);
  return `Al completar ${stamps} ${
    stamps === 1 ? "sello" : "sellos"
  }, ganás ${rewardLabel(type, value)}.`;
}

/** Descuento que aplica un beneficio sobre el costo del servicio. */
export function calculateRewardDiscount(
  serviceCost: number,
  reward: LoyaltyReward,
): number {
  if (reward.type === "FREE_SERVICE") return serviceCost;
  if (reward.type === "PERCENTAGE_DISCOUNT") {
    return serviceCost * (Math.min(100, Math.max(0, Number(reward.value || 0))) / 100);
  }
  return Math.min(serviceCost, Number(reward.value || 0));
}

/**
 * El backend vence los beneficios de forma perezosa, así que una fila
 * AVAILABLE puede estar ya pasada de `expiresAt`.
 */
export function isRewardUsable(reward: LoyaltyReward, now: Date = new Date()): boolean {
  if (reward.status !== "AVAILABLE") return false;
  return !reward.expiresAt || new Date(reward.expiresAt) > now;
}
