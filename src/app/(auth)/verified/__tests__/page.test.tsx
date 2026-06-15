import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifiedPage from "@/app/(auth)/verified/page";

const { mockResendVerification, mockSuccess } = vi.hoisted(() => ({
  mockResendVerification: vi.fn(),
  mockSuccess: { value: "true" },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (param: string) => {
      if (param === "success") return mockSuccess.value;
      return null;
    },
  }),
}));

vi.mock("@/services/auth", () => ({
  authService: {
    resendVerification: mockResendVerification,
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSuccess.value = "true";
});

describe("VerifiedPage", () => {
  it("shows success message when success=true", () => {
    render(<VerifiedPage />);

    expect(screen.getByText("Correo verificado")).toBeInTheDocument();
    expect(
      screen.getByText(/ha sido verificado correctamente/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Reenviar verificacion"),
    ).not.toBeInTheDocument();
  });

  it("shows error message and resend form when success=false", () => {
    mockSuccess.value = "false";

    render(<VerifiedPage />);

    expect(screen.getByText("Error de verificacion")).toBeInTheDocument();
    expect(
      screen.getByText(/no se pudo verificar/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Reenviar verificacion"),
    ).toBeInTheDocument();
  });

  it("validates email in resend form", async () => {
    const user = userEvent.setup();
    mockSuccess.value = "false";

    render(<VerifiedPage />);

    const emailInput = screen.getByLabelText(/^Correo electronico/);
    await user.type(emailInput, "invalid-email");

    expect(
      screen.getByText("Formato de email invalido"),
    ).toBeInTheDocument();
  });

  it("calls resendVerification on submit with valid email", async () => {
    const user = userEvent.setup();
    mockSuccess.value = "false";
    mockResendVerification.mockResolvedValue(undefined);

    render(<VerifiedPage />);

    const emailInput = screen.getByLabelText(/^Correo electronico/);
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Reenviar verificacion");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockResendVerification).toHaveBeenCalledTimes(1);
      expect(mockResendVerification).toHaveBeenCalledWith("test@example.com");
    });
  });

  it("shows success message after resend", async () => {
    const user = userEvent.setup();
    mockSuccess.value = "false";
    mockResendVerification.mockResolvedValue(undefined);

    render(<VerifiedPage />);

    const emailInput = screen.getByLabelText(/^Correo electronico/);
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Reenviar verificacion");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Correo de verificacion reenviado/i),
      ).toBeInTheDocument();
    });
  });

  it("shows error message when resend fails", async () => {
    const user = userEvent.setup();
    mockSuccess.value = "false";
    mockResendVerification.mockRejectedValue(new Error("Error"));

    render(<VerifiedPage />);

    const emailInput = screen.getByLabelText(/^Correo electronico/);
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Reenviar verificacion");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("No se pudo reenviar el correo. Intenta nuevamente."),
      ).toBeInTheDocument();
    });
  });

  it("shows link to login page", () => {
    render(<VerifiedPage />);

    expect(
      screen.getByText("Ir a iniciar sesion"),
    ).toBeInTheDocument();
  });
});
