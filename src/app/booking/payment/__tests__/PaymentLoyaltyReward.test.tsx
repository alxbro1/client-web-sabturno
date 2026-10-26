import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookingStore } from "@/stores/booking";
import SelectPaymentPage from "../page";

const { mockReplace, mockPush, mockAuthUser, mockRewardsQuery } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
  mockAuthUser: { current: null as Record<string, unknown> | null },
  mockRewardsQuery: {
    current: { data: undefined, isSuccess: false } as {
      data: unknown[] | undefined;
      isSuccess: boolean;
    },
  },
}));

// Honors `enabled` for the rewards query, like the real one: a disabled query
// never settles and returns no data.
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey: unknown[]; enabled?: boolean }) => {
    if (options.queryKey.includes("booking-rewards")) {
      return options.enabled
        ? mockRewardsQuery.current
        : { data: undefined, isSuccess: false };
    }
    return { data: undefined, isFetching: false };
  },
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
  useCreateAppointmentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/services/loyalty", () => ({
  loyaltyService: {
    getBookingRewards: vi.fn(),
    validateBookingCoupon: vi.fn(),
  },
}));

const REWARD = {
  id: "r1",
  code: "ABC",
  type: "PERCENTAGE_DISCOUNT",
  value: 20,
  status: "AVAILABLE",
  serviceId: 10,
};
const OTHER_REWARD = { ...REWARD, id: "r2", value: 50 };

const NOTICE = /Tu beneficio no aplica a este turno/;

function settle(rewards: unknown[]) {
  mockRewardsQuery.current = { data: rewards, isSuccess: true };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUser.current = { id: "user-1", email: "u@dev.sabturno" };
  mockRewardsQuery.current = { data: undefined, isSuccess: false };
  useBookingStore.setState({
    local: {
      id: "local-1",
      name: "Peluqueria Centro",
      payWithCashInFront: true,
      payWithTalo: false,
      payWithReservation: false,
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
    pendingLoyaltyRewardId: "r1",
  });
});

describe("SelectPaymentPage: beneficio de fidelidad pendiente", () => {
  it("applies the pending reward once the response contains it", () => {
    settle([REWARD]);
    render(<SelectPaymentPage />);

    expect(useBookingStore.getState().loyaltyRewardId).toBe("r1");
    expect(screen.getByText(/Descuento estimado/)).toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("keeps pending after applying so it re-applies when the time changes", () => {
    settle([REWARD]);
    const { rerender } = render(<SelectPaymentPage />);
    expect(useBookingStore.getState().pendingLoyaltyRewardId).toBe("r1");

    useBookingStore.getState().setTime("11:00");
    expect(useBookingStore.getState().loyaltyRewardId).toBeNull();
    rerender(<SelectPaymentPage />);

    expect(useBookingStore.getState().loyaltyRewardId).toBe("r1");
  });

  it("does not apply and shows the notice when the response lacks the reward", () => {
    settle([OTHER_REWARD]);
    render(<SelectPaymentPage />);

    expect(useBookingStore.getState().loyaltyRewardId).toBeNull();
    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent(
      "Tu beneficio no aplica a este turno. Puede estar vencido, ya usado o corresponder a otro servicio. Podés volver y elegir el servicio indicado.",
    );
  });

  it("shows the notice when the settled response is empty", () => {
    settle([]);
    render(<SelectPaymentPage />);

    expect(screen.getByText(NOTICE)).toBeInTheDocument();
  });

  it("dismisses the notice with Entendido", () => {
    settle([]);
    render(<SelectPaymentPage />);

    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));

    expect(useBookingStore.getState().pendingLoyaltyRewardId).toBeNull();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("neither applies nor flashes the notice while the query has not settled", () => {
    render(<SelectPaymentPage />);

    expect(useBookingStore.getState().loyaltyRewardId).toBeNull();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("clears pending on 'No usar recompensa' and does not re-apply on rerender", () => {
    settle([REWARD]);
    const { rerender } = render(<SelectPaymentPage />);
    expect(useBookingStore.getState().loyaltyRewardId).toBe("r1");

    fireEvent.click(screen.getByRole("button", { name: "No usar recompensa" }));
    rerender(<SelectPaymentPage />);

    expect(useBookingStore.getState().pendingLoyaltyRewardId).toBeNull();
    expect(useBookingStore.getState().loyaltyRewardId).toBeNull();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("clears pending when the client picks a different reward", () => {
    settle([REWARD, OTHER_REWARD]);
    render(<SelectPaymentPage />);

    fireEvent.click(screen.getByRole("button", { name: /50% de descuento/ }));

    expect(useBookingStore.getState().loyaltyRewardId).toBe("r2");
    expect(useBookingStore.getState().pendingLoyaltyRewardId).toBeNull();
  });

  it("ignores pending for a guest: nothing applied and no notice", () => {
    mockAuthUser.current = null;
    settle([REWARD]);
    render(<SelectPaymentPage />);

    expect(useBookingStore.getState().loyaltyRewardId).toBeNull();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    expect(screen.queryByText(/Descuento estimado/)).not.toBeInTheDocument();
  });
});
