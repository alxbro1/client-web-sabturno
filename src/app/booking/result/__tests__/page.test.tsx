import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppointmentResultPage from "../page";

const { mockReplace, mockSearchParams, mockUseAppointmentPublicQuery } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockSearchParams: { current: new URLSearchParams() },
  mockUseAppointmentPublicQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams.current,
}));

vi.mock("@/stores/booking", () => ({
  useBookingStore: (selector: (state: any) => unknown) =>
    selector({ taloPaymentData: null }),
}));

vi.mock("@/hooks/queries/useAppointmentPublicQuery", () => ({
  useAppointmentPublicQuery: (...args: unknown[]) => mockUseAppointmentPublicQuery(...args),
}));

vi.mock("@/components/appointment/AppointmentConfirmationActions", () => ({
  AppointmentConfirmationActions: ({ appointment }: { appointment: { id: number } }) => (
    <div data-testid="confirmation-actions">actions-for-{appointment.id}</div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAppointmentPublicQuery.mockReturnValue({
    data: undefined,
    isSuccess: false,
    isError: false,
  });
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

describe("AppointmentResultPage: acciones de confirmación (W3)", () => {
  it("fetches and renders the confirmation actions for a guest booking (appointmentId + hash)", () => {
    mockSearchParams.current = new URLSearchParams(
      "status=success&appointmentId=42&hash=guest-hash-123",
    );
    mockUseAppointmentPublicQuery.mockReturnValue({
      data: { id: 42 },
      isSuccess: true,
      isError: false,
    });

    render(<AppointmentResultPage />);

    expect(mockUseAppointmentPublicQuery).toHaveBeenCalledWith("42", "guest-hash-123");
    expect(screen.getByTestId("confirmation-actions")).toHaveTextContent("actions-for-42");
  });

  it("fetches with no hash for a logged-in booking (appointmentId only)", () => {
    mockSearchParams.current = new URLSearchParams("status=success&appointmentId=7");
    mockUseAppointmentPublicQuery.mockReturnValue({
      data: { id: 7 },
      isSuccess: true,
      isError: false,
    });

    render(<AppointmentResultPage />);

    expect(mockUseAppointmentPublicQuery).toHaveBeenCalledWith("7", "");
    expect(screen.getByTestId("confirmation-actions")).toHaveTextContent("actions-for-7");
  });

  it("does not render the actions, and keeps the success message, when the fetch fails", () => {
    mockSearchParams.current = new URLSearchParams("status=success&appointmentId=7");
    mockUseAppointmentPublicQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isError: true,
    });

    render(<AppointmentResultPage />);

    expect(screen.queryByTestId("confirmation-actions")).not.toBeInTheDocument();
    expect(screen.getByText("Reserva Exitosa!")).toBeInTheDocument();
  });

  it("does not render the actions, or fetch, for the Talo pending-payment case", () => {
    mockSearchParams.current = new URLSearchParams(
      "result=success&paymentMethod=talo&paymentId=pay-1",
    );

    render(<AppointmentResultPage />);

    expect(mockUseAppointmentPublicQuery).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
    );
    expect(screen.queryByTestId("confirmation-actions")).not.toBeInTheDocument();
  });

  it("does not render the actions when there is no appointmentId in the query", () => {
    mockSearchParams.current = new URLSearchParams("status=success&message=Listo");

    render(<AppointmentResultPage />);

    expect(screen.queryByTestId("confirmation-actions")).not.toBeInTheDocument();
  });
});
