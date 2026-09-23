import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppointmentResultPage from "../page";

const { mockReplace, mockSearchParams } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockSearchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams.current,
}));

vi.mock("@/stores/booking", () => ({
  useBookingStore: (selector: (state: any) => unknown) =>
    selector({ taloPaymentData: null }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AppointmentResultPage: profesional asignado", () => {
  it("shows the professional's name when present in the query", () => {
    mockSearchParams.current = new URLSearchParams(
      "status=success&message=Listo&employeeName=Juan",
    );

    render(<AppointmentResultPage />);

    expect(screen.getByText(/Juan/)).toBeInTheDocument();
  });

  it("does not render a professional line when the param is absent", () => {
    mockSearchParams.current = new URLSearchParams("status=success&message=Listo");

    render(<AppointmentResultPage />);

    expect(screen.queryByText(/profesional/i)).not.toBeInTheDocument();
  });
});
