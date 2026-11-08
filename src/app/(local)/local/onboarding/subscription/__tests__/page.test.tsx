import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const subscribe = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services/premium", () => ({
  premiumService: { subscribe: (...args: unknown[]) => subscribe(...args) },
}));

import OnboardingSubscriptionPage from "../page";

describe("OnboardingSubscriptionPage (credits step)", () => {
  beforeEach(() => {
    push.mockReset();
    subscribe.mockReset();
  });

  it("explains that every tool is free and does not sell plans", () => {
    render(<OnboardingSubscriptionPage />);

    expect(screen.getByText(/incluidas sin costo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Elegí tu plan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Enterprise/i)).not.toBeInTheDocument();
  });

  it("explains welcome credits, price per message and postpaid threshold", () => {
    render(<OnboardingSubscriptionPage />);

    expect(screen.getByText(/5 créditos de bienvenida/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?15 por mensaje/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?2\.000/)).toBeInTheDocument();
    expect(screen.getAllByText(/a mes vencido/i).length).toBeGreaterThan(0);
  });

  it("links to the full wallet", () => {
    render(<OnboardingSubscriptionPage />);

    expect(
      screen.getByRole("link", { name: /ver mi billetera/i }),
    ).toHaveAttribute("href", "/local/premium");
  });

  it("continues to the hours step without calling checkout", () => {
    render(<OnboardingSubscriptionPage />);

    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(push).toHaveBeenCalledWith("/local/onboarding/hours");
    expect(subscribe).not.toHaveBeenCalled();
  });
});
