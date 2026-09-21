import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocalProfilePage from "../page";

const { mockGetLocal, mockInvalidateQueries, mockUpdateLocal } = vi.hoisted(
  () => ({
    mockGetLocal: vi.fn(),
    mockInvalidateQueries: vi.fn(),
    mockUpdateLocal: vi.fn(),
  }),
);

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "local-1", name: "Peluqueria Centro" },
    updateUserProfile: vi.fn(),
  }),
}));

vi.mock("@/features/local/services/local.service", () => ({
  localService: {
    getLocal: mockGetLocal,
    updateLocal: mockUpdateLocal,
  },
}));

const WHATSAPP_LABEL =
  "Avisarme por WhatsApp cuando un cliente saque un turno";

function localFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "local-1",
    name: "Peluqueria Centro",
    email: "peluqueria.centro@dev.sabturno",
    province: "Buenos Aires",
    city: "CABA",
    address: "Calle 123",
    phone: "1122334455",
    isActive: true,
    notifyNewAppointmentWhatsapp: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateLocal.mockResolvedValue(localFixture());
});

describe("LocalProfilePage WhatsApp notification toggle", () => {
  it("disables the toggle and explains why when the business has no phone", async () => {
    mockGetLocal.mockResolvedValue(localFixture({ phone: null }));

    render(<LocalProfilePage />);

    const toggle = await screen.findByRole("switch", { name: WHATSAPP_LABEL });
    expect(toggle).toBeDisabled();
    expect(
      screen.getByText(
        "Para activar este aviso es necesario cargar el teléfono del negocio.",
      ),
    ).toBeInTheDocument();
  });

  it("sends the flag in the PATCH payload when it is enabled with a phone", async () => {
    mockGetLocal.mockResolvedValue(localFixture());

    render(<LocalProfilePage />);

    const toggle = await screen.findByRole("switch", { name: WHATSAPP_LABEL });
    expect(toggle).not.toBeDisabled();

    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() => {
      expect(mockUpdateLocal).toHaveBeenCalledWith(
        "local-1",
        expect.objectContaining({ notifyNewAppointmentWhatsapp: true }),
      );
    });
  });

  it("shows a Spanish error when the backend rejects the phone", async () => {
    mockGetLocal.mockResolvedValue(localFixture());
    mockUpdateLocal.mockRejectedValue({
      response: { status: 400 },
      message: "The phone number is not a valid WhatsApp number.",
    });

    render(<LocalProfilePage />);

    const toggle = await screen.findByRole("switch", { name: WHATSAPP_LABEL });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    expect(
      await screen.findByText(
        /No pudimos activar el aviso por WhatsApp/,
      ),
    ).toBeInTheDocument();
  });
});
