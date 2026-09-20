import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const VALID_PHONE = "+54 9 351 123 4567";
const VALID_EMAIL = "invitado@example.com";

function confirmButton() {
  return screen.getByRole("button", { name: "Confirmar turno" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUser.current = null;
  mockMutateAsync.mockResolvedValue({ id: 1 });

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

describe("SelectPaymentPage: canal de contacto del invitado", () => {
  it("habilita la confirmacion con solo el WhatsApp cuando el canal es WhatsApp", async () => {
    render(<SelectPaymentPage />);

    expect(confirmButton()).toBeDisabled();
    expect(
      screen.getByText("Ingresá tu WhatsApp para recibir la confirmación."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Teléfono"), {
      target: { value: VALID_PHONE },
    });

    await waitFor(() => expect(confirmButton()).toBeEnabled());
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("habilita la confirmacion con solo el email cuando el canal es Email", async () => {
    render(<SelectPaymentPage />);

    fireEvent.click(screen.getByRole("button", { name: "Email" }));

    expect(confirmButton()).toBeDisabled();
    expect(
      screen.getByText("Ingresá tu email para recibir la confirmación."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Teléfono")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: VALID_EMAIL },
    });

    await waitFor(() => expect(confirmButton()).toBeEnabled());
  });

  it("manda solo el campo del canal elegido en el payload", async () => {
    render(<SelectPaymentPage />);

    fireEvent.click(screen.getByRole("button", { name: "Email" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: VALID_EMAIL },
    });
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Ana" },
    });

    await waitFor(() => expect(confirmButton()).toBeEnabled());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync.mock.calls[0][0]).toMatchObject({
      email: VALID_EMAIL,
      phoneNumber: "",
      userName: "Ana",
    });
  });

  it("no deja confirmar sin ningun canal completo", () => {
    render(<SelectPaymentPage />);

    fireEvent.change(screen.getByLabelText("Teléfono"), {
      target: { value: "123" },
    });

    expect(confirmButton()).toBeDisabled();
    fireEvent.click(confirmButton());
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});

describe("SelectPaymentPage: usuario logueado", () => {
  beforeEach(() => {
    mockAuthUser.current = {
      id: "user-1",
      name: "Cliente Dev",
      email: "cliente1@dev.sabturno",
    };
  });

  it("no bloquea la confirmacion cuando la cuenta no tiene telefono", async () => {
    render(<SelectPaymentPage />);

    expect(screen.queryByRole("button", { name: "Email" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono (opcional)")).toHaveValue("");
    expect(confirmButton()).toBeEnabled();

    fireEvent.click(confirmButton());

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync.mock.calls[0][0]).toMatchObject({
      email: "cliente1@dev.sabturno",
      phoneNumber: "",
    });
  });
});
