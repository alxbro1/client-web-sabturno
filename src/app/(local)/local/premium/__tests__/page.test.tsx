import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutateCreditCheckout = vi.fn();
const mutateSettleCheckout = vi.fn();
const mutateReconcile = vi.fn();

let mockWalletData = {
  unitPriceArs: 15,
  creditsBalance: 5,
  prepaidCredits: 5,
  postpaidUsed: 0,
  postpaidAmountArs: 0,
  totalPurchasedArs: 0,
  postpaidUnlockThresholdArs: 2000,
  postpaidUnlocked: false,
  remainingToUnlockPostpaidArs: 2000,
  postpaidLimit: 200,
  billingBlocked: false,
  currentMonthSentCount: 0,
  pendingInvoice: null,
  recentTransactions: [],
};

let mockPremiumStatus = {
  currentPlanId: "basic",
  tier: "basic",
  autoRenew: false,
};

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    hasHydrated: true,
    user: { id: "local-1", isLocal: true, email: "dueno@local.com" },
  }),
}));

vi.mock("@/hooks/queries/usePremiumStatusQuery", () => ({
  usePremiumStatusQuery: () => ({
    data: mockPremiumStatus,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/queries/useWhatsappWalletQuery", () => ({
  useWhatsappWalletQuery: () => ({
    data: mockWalletData,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateCreditPackCheckoutMutation: () => ({
    mutateAsync: (...args: unknown[]) => mutateCreditCheckout(...args),
    isPending: false,
  }),
  useCreatePostpaidSettlementCheckoutMutation: () => ({
    mutateAsync: (...args: unknown[]) => mutateSettleCheckout(...args),
    isPending: false,
  }),
  useReconcileWhatsappOrderMutation: () => ({
    mutateAsync: (...args: unknown[]) => mutateReconcile(...args),
    isPending: false,
  }),
}));

import WhatsappCreditsPage from "../page";

describe("WhatsappCreditsPage", () => {
  beforeEach(() => {
    mutateCreditCheckout.mockReset();
    mutateSettleCheckout.mockReset();
    mutateReconcile.mockReset();
    mockWalletData = {
      unitPriceArs: 15,
      creditsBalance: 5,
      prepaidCredits: 5,
      postpaidUsed: 0,
      postpaidAmountArs: 0,
      totalPurchasedArs: 0,
      postpaidUnlockThresholdArs: 2000,
      postpaidUnlocked: false,
      remainingToUnlockPostpaidArs: 2000,
      postpaidLimit: 200,
      billingBlocked: false,
      currentMonthSentCount: 0,
      pendingInvoice: null,
      recentTransactions: [],
    };
    mockPremiumStatus = {
      currentPlanId: "basic",
      tier: "basic",
      autoRenew: false,
    };
  });

  it("muestra los 5 créditos de bienvenida y el progreso hacia el desbloqueo de pago a mes vencido ($2.000)", () => {
    render(<WhatsappCreditsPage />);

    expect(
      screen.getByText(/Incluye tus 5 mensajes de bienvenida gratis/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Modo prepago inicial/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Habilita pago a mes vencido/i),
    ).toBeInTheDocument();
  });

  it("valida la cantidad personalizada mínima (20 mensajes) antes de iniciar el checkout", async () => {
    render(<WhatsappCreditsPage />);

    const customInput = screen.getByLabelText(/O ingresá otra cantidad/i);
    fireEvent.change(customInput, { target: { value: "10" } });

    const buyButton = screen.getByRole("button", {
      name: /Comprar .* créditos con Mercado Pago/i,
    });
    fireEvent.click(buyButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(/entre 20 y/i);
    expect(mutateCreditCheckout).not.toHaveBeenCalled();
  });

  it("inicia la compra del pack seleccionado de 150 mensajes ($2.250)", async () => {
    mutateCreditCheckout.mockResolvedValue({
      orderId: "order-150",
      preferenceId: "pref-150",
      checkoutUrl: "",
      creditsCount: 150,
      unitPriceArs: 15,
      totalAmountArs: 2250,
    });

    render(<WhatsappCreditsPage />);

    const buyButton = screen.getByRole("button", {
      name: /Comprar 150 créditos con Mercado Pago/i,
    });
    fireEvent.click(buyButton);

    await waitFor(() =>
      expect(mutateCreditCheckout).toHaveBeenCalledWith(150),
    );
  });

  it("deriva el precio de los packs del unitPriceArs que devuelve la billetera", () => {
    mockWalletData = { ...mockWalletData, unitPriceArs: 20 };

    render(<WhatsappCreditsPage />);

    // 150 * 20 = 3000, no 150 * 15 = 2250.
    expect(screen.getAllByText(/\$\s*3[.,]000/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/\$\s*2[.,]250/)).not.toBeInTheDocument();
    // 50 * 20 = 1000 y 500 * 20 = 10000.
    expect(screen.getAllByText(/\$\s*1[.,]000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$\s*10[.,]000/).length).toBeGreaterThan(0);
  });

  it("muestra el botón para liquidar consumo acumulado cuando postpaidUsed > 0", async () => {
    mockWalletData = {
      ...mockWalletData,
      creditsBalance: -20,
      prepaidCredits: 0,
      postpaidUsed: 20,
      postpaidAmountArs: 300,
      totalPurchasedArs: 2250,
      postpaidUnlocked: true,
      remainingToUnlockPostpaidArs: 0,
    };
    mutateSettleCheckout.mockResolvedValue({
      orderId: "order-settle",
      preferenceId: "pref-settle",
      checkoutUrl: "",
      creditsCount: 20,
      unitPriceArs: 15,
      totalAmountArs: 300,
    });

    render(<WhatsappCreditsPage />);

    expect(screen.getByText("Habilitado")).toBeInTheDocument();
    const settleBtn = screen.getByRole("button", {
      name: /Pagar consumo acumulado/i,
    });
    fireEvent.click(settleBtn);

    await waitFor(() => expect(mutateSettleCheckout).toHaveBeenCalledTimes(1));
  });
});
