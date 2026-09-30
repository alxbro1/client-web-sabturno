import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifiedPage from "@/app/(auth)/verified/page";

const { mockResendVerification, mockSuccess, mockReason } = vi.hoisted(() => ({
  mockResendVerification: vi.fn(),
  mockSuccess: { value: "true" },
  mockReason: { value: null as string | null },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (param: string) => {
      if (param === "success") return mockSuccess.value;
      if (param === "reason") return mockReason.value;
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
  mockReason.value = null;
});

describe("VerifiedPage", () => {
  it("shows success message when success=true", () => {
    render(<VerifiedPage />);

    expect(screen.getByText("Correo verificado")).toBeInTheDocument();
    expect(
      screen.getByText(/ha sido verificado correctamente/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Reenviar enlace"),
    ).not.toBeInTheDocument();
  });

  it("shows error message and resend form when success=false", () => {
    mockSuccess.value = "false";

    render(<VerifiedPage />);

    expect(screen.getByText("No pudimos verificar tu correo")).toBeInTheDocument();
    expect(
      screen.getByText(/no es válido o ya fue usado/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Reenviar enlace"),
    ).toBeInTheDocument();
  });

  it("explains the link expired when reason=expired", () => {
    mockSuccess.value = "false";
    mockReason.value = "expired";

    render(<VerifiedPage />);

    expect(screen.getByText(/enlace venció/i)).toBeInTheDocument();
  });

  it("explains the link is invalid or already used when reason=invalid", () => {
    mockSuccess.value = "false";
    mockReason.value = "invalid";

    render(<VerifiedPage />);

    expect(
      screen.getByText(/no es válido o ya fue usado/i),
    ).toBeInTheDocument();
  });

  it("shows the generic backend message after a resend", async () => {
    const user = userEvent.setup();
    mockSuccess.value = "false";
    mockResendVerification.mockResolvedValue({
      ok: true,
      message: "Mensaje genérico del backend.",
    });

    render(<VerifiedPage />);

    await user.type(
      screen.getByLabelText(/^Correo electrónico/),
      "test@example.com",
    );
    await user.click(screen.getByText("Reenviar enlace"));

    await waitFor(() => {
      expect(screen.getByText("Mensaje genérico del backend.")).toBeInTheDocument();
    });
  });

  it("disables resend for an invalid email", async () => {
    const user = userEvent.setup();
    mockSuccess.value = "false";

    render(<VerifiedPage />);

    const emailInput = screen.getByLabelText(/^Correo electrónico/);
    await user.type(emailInput, "invalid-email");

    expect(screen.getByText("Reenviar enlace").closest("button")).toBeDisabled();
  });

  it("calls resendVerification on submit with valid email", async () => {
    const user = userEvent.setup();
    mockSuccess.value = "false";
    mockResendVerification.mockResolvedValue(undefined);

    render(<VerifiedPage />);

    const emailInput = screen.getByLabelText(/^Correo electrónico/);
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Reenviar enlace");
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

    const emailInput = screen.getByLabelText(/^Correo electrónico/);
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Reenviar enlace");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Te enviamos un nuevo enlace/i),
      ).toBeInTheDocument();
    });
  });

  it("shows error message when resend fails", async () => {
    const user = userEvent.setup();
    mockSuccess.value = "false";
    mockResendVerification.mockRejectedValue(new Error("Error"));

    render(<VerifiedPage />);

    const emailInput = screen.getByLabelText(/^Correo electrónico/);
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Reenviar enlace");
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
      screen.getByText("Ir a iniciar sesión"),
    ).toBeInTheDocument();
  });
});
