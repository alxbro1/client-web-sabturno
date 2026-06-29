"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { premiumService } from "@/services/premium";
import type { PremiumPlan } from "@/lib/types/premium";

/**
 * Planes hardcodeados como fallback si el backend no responde.
 *
 * Desde el deploy `premium-contract-alignment` (2026-06-28), el
 * backend devuelve este mismo shape vía `GET /premium/plans` (ver
 * `backend/src/premium/premium.service.ts:59 toPlanDto`). Este
 * FALLBACK queda como red de seguridad para outages / cold start.
 */
export const FALLBACK_PLANS: PremiumPlan[] = [
  {
    id: "basic",
    tier: "basic",
    name: "Básico",
    description: "Para empezar a recibir reservas online",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      mercadopago: true,
      talo: true,
      cashTurnsLimit: 0,
      loyalty: false,
      prioritySupport: false,
      advancedStats: false,
      unlimitedEmployees: false,
    },
  },
  {
    id: "pro",
    tier: "pro",
    name: "Pro",
    description: "Para negocios que quieren crecer",
    monthlyPrice: 8000,
    yearlyPrice: 80000,
    features: {
      mercadopago: true,
      talo: true,
      cashTurnsLimit: 500,
      loyalty: false,
      prioritySupport: true,
      advancedStats: true,
      unlimitedEmployees: false,
    },
    isPopular: true,
  },
  {
    id: "enterprise",
    tier: "enterprise",
    name: "Enterprise",
    description: "Para cadenas y locales de alto volumen",
    monthlyPrice: 15000,
    yearlyPrice: 150000,
    features: {
      mercadopago: true,
      talo: true,
      cashTurnsLimit: null,
      loyalty: true,
      prioritySupport: true,
      advancedStats: true,
      unlimitedEmployees: true,
    },
  },
];

export function usePremiumPlansQuery() {
  return useQuery({
    queryKey: queryKeys.premiumPlans(),
    queryFn: () => premiumService.getPlans(),
    staleTime: 5 * 60_000,
    placeholderData: FALLBACK_PLANS,
  });
}
