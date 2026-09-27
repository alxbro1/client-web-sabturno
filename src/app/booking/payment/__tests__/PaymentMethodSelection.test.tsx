import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookingStore } from "@/stores/booking";
import SelectPaymentPage from "../page";

const { mockMutateAsync, mockReplace, mockPush, mockAuthUser } = vi.hoisted(
  () => ({
    mockMutateAsync: vi.fn(),
    mockReplace: vi.fn(),
    mockPush: vi.fn(),
    mockAuthUser: { current: null as Record<string, unknown> | null },
  }),
);

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined, isFetching: false }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockAuthUser.current }),
}));

vi.mock("@/hooks/queries/useTaloStatusQuery", () => ({
  useTaloStatusQuery: () => ({ data: { connected: false } }),
}));

vi.mock("@/hooks/mutations/useCreateAppointmentMutation", () => ({
  useCreateAppointmentMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/services/loyalty", () => ({
  loyaltyService: {
    getBookingRewards: vi.fn(),
    validateBookingCoupon: vi.fn(),
  },
}));


beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUser.current = null;
  useBookingStore.setState({
    local: {
      id: "local-1",
      name: "Peluqueria Centro",
      payWithCashInFront: true,
      payWithTalo: false,
      payWithReservation: true,
      reservationPercentage: 30,
      mercadoPagoLiveMode: false,
      timezone: "America/Argentina/Buenos_Aires",
      countryCode: "AR",
    } as any,
    service: { id: 10, name: "Corte", cost: 5000 } as any,
    date: "2026-10-01",
    time: "10:00",
    phoneNumber: "",
    paymentMethod: null,
    loyaltyRewardId: null,
    loyaltyCouponCode: "",
  });
});

describe("SelectPaymentPage: selección del método de pago", () => {
  it("presents the methods as a labelled choice with an explicit instruction", () => {
    render(<SelectPaymentPage />);

    const group = screen.getByRole("radiogroup", { name: "Método de pago" });
    expect(group).toHaveAccessibleDescription("Seleccioná uno para continuar.");

    const options = within(group).getAllByRole("radio");
    expect(options.length).toBeGreaterThan(1);
    options.forEach((option) => expect(option).toHaveAttribute("aria-checked", "false"));
  });

  it("marks only the picked method as checked", () => {
    render(<SelectPaymentPage />);

    const [first, second] = within(
      screen.getByRole("radiogroup", { name: "Método de pago" }),
    ).getAllByRole("radio");
    fireEvent.click(second);

    expect(second).toHaveAttribute("aria-checked", "true");
    expect(first).toHaveAttribute("aria-checked", "false");
  });
});
