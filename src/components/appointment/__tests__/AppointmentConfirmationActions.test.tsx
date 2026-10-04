import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppointmentPublicDetails } from "@/lib/types/booking";
import { AppointmentConfirmationActions } from "../AppointmentConfirmationActions";

const cancelBooking = vi.fn();
const cancelAppointmentPublic = vi.fn();

vi.mock("@/services/booking", () => ({
  bookingService: {
    cancelBooking: (...args: unknown[]) => cancelBooking(...args),
    cancelAppointmentPublic: (...args: unknown[]) => cancelAppointmentPublic(...args),
  },
}));

function makeAppointment(
  overrides: Partial<AppointmentPublicDetails> = {},
): AppointmentPublicDetails {
  return {
    id: 42,
    state: "CONFIRMED",
    startDateTime: "2026-10-15T15:00:00.000Z",
    endDateTime: "2026-10-15T15:30:00.000Z",
    timezone: "America/Argentina/Buenos_Aires",
    userId: null,
    accessHash: "guest-hash-123",
    email: "cliente@example.com",
    userName: "Cliente de prueba",
    phoneNumber: null,
    service: {
      id: 10,
      name: "Corte de pelo",
      description: "",
      cost: 5000,
      duration: 30,
      category: "haircuts",
      isActive: true,
    },
    local: {
      id: "local-1",
      name: "Peluquería Centro",
      email: "local@example.com",
      province: "Buenos Aires",
      city: "CABA",
      address: "Av. Siempre Viva 123",
      isActive: true,
    },
    ...overrides,
  };
}

beforeEach(() => {
  cancelBooking.mockReset();
  cancelAppointmentPublic.mockReset();
});

describe("AppointmentConfirmationActions", () => {
  it("renders a Google Calendar link with the correct action and encoded details", () => {
    render(<AppointmentConfirmationActions appointment={makeAppointment()} />);

    const link = screen.getByRole("link", { name: /calendar/i });
    const url = new URL(link.getAttribute("href") || "");

    expect(url.origin + url.pathname).toBe(
      "https://calendar.google.com/calendar/render",
    );
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("requires a second click to confirm cancellation before calling the cancel service", async () => {
    const user = userEvent.setup();
    cancelAppointmentPublic.mockResolvedValue(true);

    render(<AppointmentConfirmationActions appointment={makeAppointment()} />);

    const cancelButton = screen.getByRole("button", { name: /cancelar turno/i });
    await user.click(cancelButton);

    expect(cancelAppointmentPublic).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /confirmar cancelaci/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirmar cancelaci/i }));

    await waitFor(() => {
      expect(cancelAppointmentPublic).toHaveBeenCalledWith("42", "guest-hash-123");
    });
  });

  it("calls the session-based cancel endpoint when the appointment has no accessHash", async () => {
    const user = userEvent.setup();
    cancelBooking.mockResolvedValue(true);

    render(
      <AppointmentConfirmationActions
        appointment={makeAppointment({ accessHash: null, userId: "user-1" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancelar turno/i }));
    await user.click(screen.getByRole("button", { name: /confirmar cancelaci/i }));

    await waitFor(() => {
      expect(cancelBooking).toHaveBeenCalledWith("42");
    });
    expect(cancelAppointmentPublic).not.toHaveBeenCalled();
  });

  it("shows an inline error when cancellation fails", async () => {
    const user = userEvent.setup();
    cancelAppointmentPublic.mockRejectedValue({
      response: { data: { message: "No se pudo cancelar" } },
    });

    render(<AppointmentConfirmationActions appointment={makeAppointment()} />);

    await user.click(screen.getByRole("button", { name: /cancelar turno/i }));
    await user.click(screen.getByRole("button", { name: /confirmar cancelaci/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cancelar");
    });
  });

  it("renders the create-account CTA only for guest appointments (no userId)", () => {
    const { rerender } = render(
      <AppointmentConfirmationActions
        appointment={makeAppointment({ userId: null })}
      />,
    );
    expect(screen.getByRole("link", { name: /crear cuenta/i })).toBeInTheDocument();

    rerender(
      <AppointmentConfirmationActions
        appointment={makeAppointment({ userId: "user-1" })}
      />,
    );
    expect(screen.queryByRole("link", { name: /crear cuenta/i })).not.toBeInTheDocument();
  });

  it("links the create-account CTA to /register with prefill query params", () => {
    render(
      <AppointmentConfirmationActions
        appointment={makeAppointment({
          userId: null,
          userName: "Cliente de prueba",
          email: "cliente@example.com",
          phoneNumber: "+5491122334455",
        })}
      />,
    );

    const link = screen.getByRole("link", { name: /crear cuenta/i });
    const href = link.getAttribute("href") || "";
    const url = new URL(href, "https://example.com");

    expect(url.pathname).toBe("/register");
    expect(url.searchParams.get("name")).toBe("Cliente de prueba");
    expect(url.searchParams.get("email")).toBe("cliente@example.com");
    expect(url.searchParams.get("phone")).toBe("+5491122334455");
  });
});
