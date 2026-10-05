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
    instagram: null,
    slotIntervalMinutes: 30,
    ...overrides,
  };
}

const INSTAGRAM_LABEL = "Instagram";
const SLOT_INTERVAL_LABEL = "Intervalo entre turnos (minutos)";

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

describe("LocalProfilePage Instagram field", () => {
  it("prefills the existing handle", async () => {
    mockGetLocal.mockResolvedValue(localFixture({ instagram: "peluqueria.centro" }));

    render(<LocalProfilePage />);

    const input = await screen.findByLabelText(INSTAGRAM_LABEL);
    expect(input).toHaveValue("peluqueria.centro");
  });

  it("has an empty input with the @tulocal placeholder when there is none", async () => {
    mockGetLocal.mockResolvedValue(localFixture({ instagram: null }));

    render(<LocalProfilePage />);

    const input = await screen.findByLabelText(INSTAGRAM_LABEL);
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "@tulocal");
  });

  it("sends the typed handle in the PATCH payload", async () => {
    mockGetLocal.mockResolvedValue(localFixture({ instagram: null }));

    render(<LocalProfilePage />);

    const input = await screen.findByLabelText(INSTAGRAM_LABEL);
    fireEvent.change(input, { target: { value: "nueva.cuenta" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() => {
      expect(mockUpdateLocal).toHaveBeenCalledWith(
        "local-1",
        expect.objectContaining({ instagram: "nueva.cuenta" }),
      );
    });
  });

  it("clears the handle by sending an empty string", async () => {
    mockGetLocal.mockResolvedValue(localFixture({ instagram: "peluqueria.centro" }));

    render(<LocalProfilePage />);

    const input = await screen.findByLabelText(INSTAGRAM_LABEL);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() => {
      expect(mockUpdateLocal).toHaveBeenCalledWith(
        "local-1",
        expect.objectContaining({ instagram: "" }),
      );
    });
  });

  it("shows the backend message when the handle is invalid", async () => {
    mockGetLocal.mockResolvedValue(localFixture({ instagram: null }));
    mockUpdateLocal.mockRejectedValue({
      response: { status: 400 },
      message: "instagram must be a valid handle: letters, numbers, \".\" and \"_\" only, up to 30 characters",
    });

    render(<LocalProfilePage />);

    const input = await screen.findByLabelText(INSTAGRAM_LABEL);
    fireEvent.change(input, { target: { value: "no valido!" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    expect(
      await screen.findByText(/instagram must be a valid handle/),
    ).toBeInTheDocument();
  });
});

describe("LocalProfilePage slot interval field", () => {
  it("prefills the loaded value", async () => {
    mockGetLocal.mockResolvedValue(localFixture({ slotIntervalMinutes: 45 }));

    render(<LocalProfilePage />);

    const input = await screen.findByLabelText(SLOT_INTERVAL_LABEL);
    expect(input).toHaveValue(45);
  });

  it("blocks submit with a visible error when the value is out of bounds", async () => {
    mockGetLocal.mockResolvedValue(localFixture());

    render(<LocalProfilePage />);

    const input = await screen.findByLabelText(SLOT_INTERVAL_LABEL);
    fireEvent.change(input, { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    expect(
      await screen.findByText(/entre 5 y 120/),
    ).toBeInTheDocument();
    expect(mockUpdateLocal).not.toHaveBeenCalled();
  });

  it("sends the valid value in the PATCH payload", async () => {
    mockGetLocal.mockResolvedValue(localFixture());

    render(<LocalProfilePage />);

    const input = await screen.findByLabelText(SLOT_INTERVAL_LABEL);
    fireEvent.change(input, { target: { value: "45" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() => {
      expect(mockUpdateLocal).toHaveBeenCalledWith(
        "local-1",
        expect.objectContaining({ slotIntervalMinutes: 45 }),
      );
    });
  });
});
