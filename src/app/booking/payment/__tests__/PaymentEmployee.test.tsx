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

function confirmButton() {
  return screen.getByRole("button", { name: "Confirmar turno" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUser.current = {
    id: "user-1",
    name: "Cliente Dev",
    email: "cliente1@dev.sabturno",
  };
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

describe("SelectPaymentPage: employeeId en el payload", () => {
  it("sends employeeId when a specific employee was chosen", async () => {
    useBookingStore.setState({ employee: EMPLOYEE });
    render(<SelectPaymentPage />);

    await waitFor(() => expect(confirmButton()).toBeEnabled());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync.mock.calls[0][0]).toMatchObject({
      employeeId: "emp-1",
    });
  });

  it("does not send employeeId when 'any' (no preference) was chosen", async () => {
    useBookingStore.setState({ employee: "any" });
    render(<SelectPaymentPage />);

    await waitFor(() => expect(confirmButton()).toBeEnabled());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync.mock.calls[0][0]).not.toHaveProperty("employeeId");
  });
});

describe("SelectPaymentPage: nombre del profesional en la redirección de éxito", () => {
  it("includes employeeName in the redirect when the backend returns one", async () => {
    useBookingStore.setState({ employee: EMPLOYEE });
    mockMutateAsync.mockResolvedValue({
      id: 1,
      employee: { id: "emp-1", name: "Juan", avatar: null },
    });

    render(<SelectPaymentPage />);
    await waitFor(() => expect(confirmButton()).toBeEnabled());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    const target = mockReplace.mock.calls[0][0] as string;
    expect(target).toContain("employeeName=Juan");
  });
});
