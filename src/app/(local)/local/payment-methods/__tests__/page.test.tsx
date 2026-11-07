import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pmState = {
  form: {
    mercadoPagoLiveMode: false,
    payWithTalo: false,
    payWithReservation: false,
    payWithCashInFront: false,
    reservationPercentage: "",
  },
  toggle: vi.fn(),
};
const premiumState: { tier: string } = { tier: "basic" };

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "local-1" }, hasHydrated: true }),
}));
vi.mock("@/hooks/queries/usePremiumStatusQuery", () => ({
  usePremiumStatusQuery: () => ({ data: premiumState }),
}));
vi.mock("@/features/payment-methods", async () => {
  const actual = await vi.importActual<object>(
    "@/features/payment-methods/components",
  );
  return {
    ...actual,
    usePaymentMethods: () => ({
      ...pmState,
      isLoading: false,
      isSaving: false,
      isTaloLoading: false,
      taloStatus: null,
      error: null,
      save: vi.fn(),
      setReservationPercentage: vi.fn(),
    }),
  };
});

import PaymentMethodsPage from "../page";

function cashCard() {
  return screen.getByRole("button", { name: "Efectivo en el local" });
}

describe("PaymentMethodsPage — cash is available on every plan", () => {
  beforeEach(() => {
    pmState.toggle.mockClear();
    premiumState.tier = "basic";
  });

  it("lets the owner turn cash off after a downgrade", () => {
    pmState.form.payWithCashInFront = true;
    render(<PaymentMethodsPage />);

    expect(cashCard()).not.toBeDisabled();
    fireEvent.click(cashCard());
    expect(pmState.toggle).toHaveBeenCalledWith("payWithCashInFront");
  });

  it("shows no upgrade prompt and keeps cash usable when it is off", () => {
    pmState.form.payWithCashInFront = false;
    render(<PaymentMethodsPage />);

    expect(screen.queryByRole("button", { name: "Upgrade" })).toBeNull();
    expect(cashCard()).not.toBeDisabled();
    fireEvent.click(cashCard());
    expect(pmState.toggle).toHaveBeenCalledWith("payWithCashInFront");
  });
});
