import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { LoyaltyCard, LoyaltyReward } from "@/lib/types/loyalty";
import { parseBookingQuery } from "@/lib/utils/bookingQuery";

const { mockApiService, authRef } = vi.hoisted(() => ({
  mockApiService: { get: vi.fn() },
  authRef: { user: { timezone: "America/Argentina/Buenos_Aires" } as unknown },
}));

vi.mock("@/lib/api", () => ({ apiService: mockApiService }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: authRef.user }),
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import RewardsPage from "@/app/(client)/rewards/page";

function reward(overrides: Partial<LoyaltyReward> = {}): LoyaltyReward {
  return {
    id: "reward-1",
    code: "a".repeat(32),
    type: "FREE_SERVICE",
    value: null,
    serviceId: 10,
    status: "AVAILABLE",
    expiresAt: null,
    service: { id: 10, name: "Corte" },
    ...overrides,
  };
}

function card(overrides: Partial<LoyaltyCard> = {}): LoyaltyCard {
  return {
    id: "card-1",
    localId: "local-1",
    stampsBalance: 2,
    totalStampsEarned: 2,
    status: "ACTIVE",
    expiresAt: null,
    local: { id: "local-1", name: "Peluqueria Centro" },
    program: {
      id: "program-1",
      localId: "local-1",
      name: "Tarjeta de fidelidad",
      status: "ACTIVE",
      revisions: [],
      services: [],
    },
    revision: {
      id: "rev-1",
      version: 1,
      stampsRequired: 6,
      stampsPerAppointment: 1,
      rewardType: "FREE_SERVICE",
      rewardValue: null,
      rewardServiceId: 10,
    },
    rewards: [],
    ...overrides,
  };
}

function renderPage(cards: LoyaltyCard[]) {
  mockApiService.get.mockResolvedValue({ data: cards });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RewardsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authRef.user = { timezone: "America/Argentina/Buenos_Aires" };
});

describe("RewardsPage", () => {
  it("enlaza el beneficio al flujo de reserva con local, servicio y beneficio", async () => {
    renderPage([card({ rewards: [reward()] })]);

    const link = await screen.findByRole("link", { name: /Usar este beneficio/ });
    const href = link.getAttribute("href") as string;
    expect(href.startsWith("/booking/select-service?")).toBe(true);
    expect(parseBookingQuery(new URLSearchParams(href.split("?")[1]))).toEqual({
      localId: "local-1",
      serviceId: 10,
      coupon: null,
      rewardId: "reward-1",
    });
  });

  it("un beneficio sin servicio enlaza sin serviceId y pide elegir el servicio", async () => {
    renderPage([
      card({
        rewards: [reward({ serviceId: null, service: null, type: "PERCENTAGE_DISCOUNT", value: 20 })],
      }),
    ]);

    const link = await screen.findByRole("link", { name: /Usar este beneficio/ });
    const href = link.getAttribute("href") as string;
    expect(parseBookingQuery(new URLSearchParams(href.split("?")[1])).serviceId).toBeNull();
    expect(
      screen.getByText("Elegí el servicio, el día y el horario."),
    ).toBeInTheDocument();
  });

  it("anuncia el beneficio y explica cómo usarlo cuando hay uno usable", async () => {
    renderPage([card({ rewards: [reward()] })]);

    expect(
      await screen.findByText("Tenés un beneficio para usar"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tocá «Usar este beneficio».")).toBeInTheDocument();
    expect(screen.getByText("Elegí día y horario.")).toBeInTheDocument();
    expect(
      screen.getByText("Vas a ver el descuento aplicado antes de confirmar."),
    ).toBeInTheDocument();
  });

  it("pluraliza el anuncio con más de un beneficio usable", async () => {
    renderPage([
      card({ rewards: [reward(), reward({ id: "r2", code: "c2" })] }),
    ]);

    expect(
      await screen.findByText("Tenés 2 beneficios para usar"),
    ).toBeInTheDocument();
  });

  it("no anuncia nada si no hay beneficio usable", async () => {
    renderPage([
      card({ rewards: [reward({ expiresAt: "2020-01-01T12:00:00.000Z" })] }),
    ]);

    await screen.findByText("Últimos movimientos");
    expect(screen.queryByText(/beneficio para usar|beneficios para usar/)).toBeNull();
    expect(screen.queryByText("Tocá «Usar este beneficio».")).toBeNull();
    expect(screen.queryByRole("link", { name: /Usar este beneficio/ })).toBeNull();
  });

  it("no renderiza tarjetas vencidas ni archivadas", async () => {
    renderPage([
      card({ id: "c-exp", status: "EXPIRED", local: { id: "l2", name: "Local Vencido" }, rewards: [reward()] }),
      card({ id: "c-arch", status: "ARCHIVED", local: { id: "l3", name: "Local Archivado" }, rewards: [reward()] }),
      card({ id: "c-ok", local: { id: "l1", name: "Local Activo" } }),
    ]);

    expect(await screen.findByText("Local Activo")).toBeInTheDocument();
    expect(screen.queryByText("Local Vencido")).toBeNull();
    expect(screen.queryByText("Local Archivado")).toBeNull();
    expect(screen.queryByRole("link", { name: /Usar este beneficio/ })).toBeNull();
  });

  it("muestra el estado vacío cuando no hay tarjetas activas", async () => {
    renderPage([card({ status: "EXPIRED" })]);

    expect(
      await screen.findByText("Todavía no tenés tarjetas activas"),
    ).toBeInTheDocument();
  });

  it("mantiene el bloque de últimos movimientos", async () => {
    renderPage([
      card({
        movements: [
          { id: "m1", type: "STAMP", stamps: 1, balanceAfter: 2, createdAt: "2026-10-01T12:00:00.000Z" },
        ],
      }),
    ]);

    expect(await screen.findByText("Últimos movimientos")).toBeInTheDocument();
    expect(screen.getByText(/\+1 sellos · saldo 2/)).toBeInTheDocument();
  });
});
