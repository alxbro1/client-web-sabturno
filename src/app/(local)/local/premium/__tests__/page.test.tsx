import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const subscribe = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    hasHydrated: true,
    user: { id: "u1", isLocal: true, email: "dueno@local.com" },
  }),
}));
vi.mock("@/hooks/queries/usePremiumStatusQuery", () => ({
  usePremiumStatusQuery: () => ({
    data: { currentPlanId: "basic", tier: "basic" },
    isLoading: false,
  }),
}));
vi.mock("@/hooks/queries/usePremiumPlansQuery", async () => {
  const actual = await vi.importActual<
    typeof import("@/hooks/queries/usePremiumPlansQuery")
  >("@/hooks/queries/usePremiumPlansQuery");
  return { ...actual, usePremiumPlansQuery: () => ({ data: undefined }) };
});
vi.mock("@/services/premium", () => ({
  premiumService: { subscribe: (...args: unknown[]) => subscribe(...args) },
}));

import PremiumPage from "../page";

const LABEL = "Email de tu cuenta de Mercado Pago";

function proButton() {
  // Basic is the current plan, so the first "Elegir plan" belongs to Pro.
  return screen.getAllByRole("button", { name: "Elegir plan" })[0];
}

describe("PremiumPage — Mercado Pago email", () => {
  beforeEach(() => {
    subscribe.mockReset();
    subscribe.mockResolvedValue({ checkoutUrl: null, subscriptionId: "s" });
  });

  it("prefills the field with the session email", () => {
    render(<PremiumPage />);
    expect(screen.getByLabelText(LABEL)).toHaveValue("dueno@local.com");
  });

  it("blocks subscribe and shows an error when the email is invalid", async () => {
    render(<PremiumPage />);
    fireEvent.change(screen.getByLabelText(LABEL), {
      target: { value: "roto" },
    });
    fireEvent.click(proButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(/email válido/i);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("sends the trimmed edited email as payerEmail", async () => {
    render(<PremiumPage />);
    fireEvent.change(screen.getByLabelText(LABEL), {
      target: { value: "  mp@cuenta.com " },
    });
    fireEvent.click(proButton());
    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1));
    expect(subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ payerEmail: "mp@cuenta.com" }),
    );
  });
});
