import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { BookingLinkCard } from "@/components/local/BookingLinkCard";
import { buildLocalBookingPath } from "@/lib/utils/bookingQuery";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const LOCAL_ID = "8a9846e4-53c5-4f48-a9b0-0b6d169636d9";

function setClipboard(writeText: ((text: string) => Promise<void>) | undefined) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}

describe("BookingLinkCard", () => {
  const expectedUrl = () => `${window.location.origin}${buildLocalBookingPath(LOCAL_ID)}`;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setClipboard(undefined);
  });

  it("shows the public booking URL built from the current origin", async () => {
    setClipboard(vi.fn().mockResolvedValue(undefined));

    render(<BookingLinkCard localId={LOCAL_ID} />);

    const input = await screen.findByLabelText("Tu link de reserva");
    await waitFor(() => expect(input).toHaveValue(expectedUrl()));
    expect(input).toHaveAttribute("readonly");
  });

  it("copies exactly that URL and confirms with Copiado", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);

    render(<BookingLinkCard localId={LOCAL_ID} />);
    await waitFor(() => expect(screen.getByLabelText("Tu link de reserva")).toHaveValue(expectedUrl()));

    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Copiado" })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(expectedUrl());
    expect(toast.success).toHaveBeenCalledWith("Link copiado");
    expect(screen.getByRole("status")).toHaveTextContent("Link copiado");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a manual-copy error when the clipboard write is rejected", async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error("denied")));

    render(<BookingLinkCard localId={LOCAL_ID} />);
    await waitFor(() => expect(screen.getByLabelText("Tu link de reserva")).toHaveValue(expectedUrl()));

    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));

    const message = "No se pudo copiar. Seleccioná el link y copialo a mano.";
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(toast.error).toHaveBeenCalledWith(message);
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument();
  });

  it("shows the same error when the Clipboard API is unavailable", async () => {
    setClipboard(undefined);

    render(<BookingLinkCard localId={LOCAL_ID} />);
    await waitFor(() => expect(screen.getByLabelText("Tu link de reserva")).toHaveValue(expectedUrl()));

    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
