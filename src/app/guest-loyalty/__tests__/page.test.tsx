import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { LoyaltyCard, LoyaltyReward } from "@/lib/types/loyalty";
import {
  buildLocalBookingPath,
  parseBookingQuery,
} from "@/lib/utils/bookingQuery";

const { mockApiService } = vi.hoisted(() => ({
  mockApiService: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("@/lib/api", () => ({ apiService: mockApiService }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("token=guest-token"),
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

import GuestLoyaltyPage from "@/app/guest-loyalty/page";

function reward(overrides: Partial<LoyaltyReward> = {}): LoyaltyReward {
  return {
    id: "reward-1",
    code: "c".repeat(32),
    type: "FREE_SERVICE",
    value: null,
    serviceId: 10,
    status: "AVAILABLE",
    expiresAt: null,
    service: { id: 10, name: "Corte" },
    ...overrides,
  };
}

function card(rewards: LoyaltyReward[]): LoyaltyCard {
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
    rewards,
  };
}

function renderPage(rewards: LoyaltyReward[]) {
  mockApiService.post.mockResolvedValue({ data: { cards: [card(rewards)] } });
  mockApiService.get.mockResolvedValue({ data: { cards: [card(rewards)] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GuestLoyaltyPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GuestLoyaltyPage CTA", () => {
  it("con un beneficio usable el CTA lleva el código como cupón", async () => {
    renderPage([reward()]);

    const link = await screen.findByRole("link", {
      name: /Reservar usando mi beneficio/,
    });
    const href = link.getAttribute("href") as string;
    expect(parseBookingQuery(new URLSearchParams(href.split("?")[1]))).toEqual({
      localId: "local-1",
      serviceId: 10,
      coupon: "c".repeat(32),
      rewardId: null,
    });
  });

  it("elige el beneficio que vence primero y deja al que no vence último", async () => {
    renderPage([
      reward({ id: "sin-vencer", code: "n".repeat(32), expiresAt: null }),
      reward({ id: "tarde", code: "t".repeat(32), expiresAt: "2999-12-01T12:00:00.000Z" }),
      reward({ id: "pronto", code: "p".repeat(32), expiresAt: "2998-01-01T12:00:00.000Z" }),
    ]);

    const link = await screen.findByRole("link", {
      name: /Reservar usando mi beneficio/,
    });
    const href = link.getAttribute("href") as string;
    expect(href).toContain(`coupon=${"p".repeat(32)}`);
  });

  it("sin beneficios mantiene el CTA de siempre", async () => {
    renderPage([]);

    const link = await screen.findByRole("link", {
      name: /Reservar mi próximo turno/,
    });
    expect(link).toHaveAttribute("href", buildLocalBookingPath("local-1"));
  });

  it("un beneficio AVAILABLE ya vencido no genera enlace con cupón", async () => {
    renderPage([reward({ expiresAt: "2020-01-01T12:00:00.000Z" })]);

    const link = await screen.findByRole("link", {
      name: /Reservar mi próximo turno/,
    });
    expect(link.getAttribute("href")).not.toContain("coupon=");
    expect(
      screen.queryByRole("link", { name: /Reservar usando mi beneficio/ }),
    ).toBeNull();
  });
});
