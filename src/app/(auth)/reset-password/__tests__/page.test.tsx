import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";

const { mockResetPassword, mockToken } = vi.hoisted(() => ({
  mockResetPassword: vi.fn(),
  mockToken: { value: "valid-token" },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (param: string) => {
      if (param === "token") return mockToken.value;
      return null;
    },
  }),
}));

vi.mock("@/services/auth", () => ({
  authService: {
    resetPassword: mockResetPassword,
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
  mockToken.value = "valid-token";
});

describe("ResetPasswordPage", () => {
  it("shows invalid link message when no token is present", () => {
    mockToken.value = null;

    render(<ResetPasswordPage />);

    expect(screen.getByText("Enlace invalido")).toBeInTheDocument();
    expect(screen.getByText(/no es valido o ha expirado/i)).toBeInTheDocument();
    expect(screen.getByText("Solicitar nuevo enlace")).toBeInTheDocument();
  });

  it("renders password form when token is present", () => {
    render(<ResetPasswordPage />);

    expect(screen.getByRole("heading", { name: /nueva contrasena/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nueva contrasena/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirmar contrasena/)).toBeInTheDocument();
    expect(screen.getByText("Restablecer contrasena")).toBeInTheDocument();
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/^Nueva contrasena/);
    await user.type(passwordInput, "ab");

    expect(
      screen.getByText("La contrasena debe tener al menos 6 caracteres"),
    ).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/^Nueva contrasena/);
    const confirmInput = screen.getByLabelText(/^Confirmar contrasena/);

    await user.type(passwordInput, "validpassword123");
    await user.type(confirmInput, "different");

    expect(
      screen.getByText("Las contrasenas no coinciden"),
    ).toBeInTheDocument();
  });

  it("calls authService.resetPassword on submit with valid data", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/^Nueva contrasena/);
    const confirmInput = screen.getByLabelText(/^Confirmar contrasena/);

    await user.type(passwordInput, "newpassword123");
    await user.type(confirmInput, "newpassword123");

    const submitButton = screen.getByText("Restablecer contrasena");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledTimes(1);
      expect(mockResetPassword).toHaveBeenCalledWith(
        "valid-token",
        "newpassword123",
      );
    });
  });

  it("shows success state after password reset", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/^Nueva contrasena/);
    const confirmInput = screen.getByLabelText(/^Confirmar contrasena/);

    await user.type(passwordInput, "newpassword123");
    await user.type(confirmInput, "newpassword123");

    const submitButton = screen.getByText("Restablecer contrasena");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Contrasena restablecida")).toBeInTheDocument();
      expect(
        screen.getByText(/fue actualizada correctamente/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Ir al login")).toBeInTheDocument();
    });
  });

  it("shows error message when API call fails", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockRejectedValue(
      new Error(
        "No se pudo restablecer la contrasena. Intenta nuevamente.",
      ),
    );
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/^Nueva contrasena/);
    const confirmInput = screen.getByLabelText(/^Confirmar contrasena/);

    await user.type(passwordInput, "newpassword123");
    await user.type(confirmInput, "newpassword123");

    const submitButton = screen.getByText("Restablecer contrasena");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No se pudo restablecer la contrasena. Intenta nuevamente.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("disables submit button while loading", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockImplementation(() => new Promise(() => {}));
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/^Nueva contrasena/);
    const confirmInput = screen.getByLabelText(/^Confirmar contrasena/);

    await user.type(passwordInput, "newpassword123");
    await user.type(confirmInput, "newpassword123");

    const submitButton = screen.getByText("Restablecer contrasena");
    await user.click(submitButton);

    expect(screen.getByText("Restableciendo...")).toBeInTheDocument();
  });
});
