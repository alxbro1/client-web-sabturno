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

describe("PaymentMethodsPage — cash on a basic plan", () => {
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

  it("keeps cash locked when it is off", () => {
    pmState.form.payWithCashInFront = false;
    render(<PaymentMethodsPage />);

    expect(cashCard()).toBeDisabled();
    fireEvent.click(cashCard());
    expect(pmState.toggle).not.toHaveBeenCalled();
  });

  it("renders the upgrade prompt outside the card button", () => {
    pmState.form.payWithCashInFront = false;
    render(<PaymentMethodsPage />);

    const upgrade = screen.getByRole("button", { name: "Upgrade" });
    expect(cashCard().contains(upgrade)).toBe(false);
  });
});
