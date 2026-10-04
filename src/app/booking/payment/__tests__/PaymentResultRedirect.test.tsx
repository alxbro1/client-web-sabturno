import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookingStore } from "@/stores/booking";
import SelectPaymentPage from "../page";
import type { PublicEmployee } from "@/lib/types/employee";

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

const EMPLOYEE: PublicEmployee = { id: "emp-1", name: "Juan", color: "#00f068" };
const VALID_PHONE = "+54 9 351 123 4567";

function confirmButton() {
  return screen.getByRole("button", { name: "Confirmar turno" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUser.current = null;
  mockMutateAsync.mockResolvedValue({ id: 1 });

  useBookingStore.setState(useBookingStore.getInitialState());
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
  });
});

describe("SelectPaymentPage: redirección sin gateway externo", () => {
  it("passes structured appointmentId and hash for a guest booking instead of an embedded message", async () => {
    mockMutateAsync.mockResolvedValue({ id: 2, accessHash: "hash-abc" });
    useBookingStore.setState({ employee: EMPLOYEE });

    render(<SelectPaymentPage />);
    fireEvent.change(screen.getByLabelText("Teléfono"), {
      target: { value: VALID_PHONE },
    });
    await waitFor(() => expect(confirmButton()).toBeEnabled());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    const target = mockReplace.mock.calls[0][0] as string;

    expect(target).toContain("status=success");
    expect(target).toContain("appointmentId=2");
    expect(target).toContain("hash=hash-abc");
    expect(target).not.toContain("message=");
  });

  it("passes structured appointmentId without a hash for a logged-in booking", async () => {
    mockAuthUser.current = { id: "user-1", name: "Cliente", email: "cliente@dev.sabturno" };
    mockMutateAsync.mockResolvedValue({ id: 3 });
    useBookingStore.setState({ employee: EMPLOYEE });

    render(<SelectPaymentPage />);
    await waitFor(() => expect(confirmButton()).toBeEnabled());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    const target = mockReplace.mock.calls[0][0] as string;

    expect(target).toContain("status=success");
    expect(target).toContain("appointmentId=3");
    expect(target).not.toContain("hash=");
    expect(target).not.toContain("message=");
  });
});
