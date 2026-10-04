import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "../page";

const { mockReplace, mockSearchParams } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockSearchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams.current,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams.current = new URLSearchParams();
});

describe("RegisterPage: prefill desde query params (W6)", () => {
  it("prefills name, email and phone when all three are present", () => {
    mockSearchParams.current = new URLSearchParams(
      "name=Cliente+de+prueba&email=cliente%40example.com&phone=%2B5491122334455",
    );

    render(<RegisterPage />);

    expect(screen.getByLabelText("Nombre")).toHaveValue("Cliente de prueba");
    expect(screen.getByLabelText("Correo electronico")).toHaveValue(
      "cliente@example.com",
    );
    expect(screen.getByLabelText("Teléfono")).toHaveValue("+5491122334455");
  });

  it("prefills only the params that are present, leaving the rest empty", () => {
    mockSearchParams.current = new URLSearchParams("email=cliente%40example.com");

    render(<RegisterPage />);

    expect(screen.getByLabelText("Nombre")).toHaveValue("");
    expect(screen.getByLabelText("Correo electronico")).toHaveValue(
      "cliente@example.com",
    );
    expect(screen.getByLabelText("Teléfono")).toHaveValue("");
  });

  it("renders normal empty registration when no query params are present", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText("Nombre")).toHaveValue("");
    expect(screen.getByLabelText("Correo electronico")).toHaveValue("");
    expect(screen.getByLabelText("Teléfono")).toHaveValue("");
  });
});
