import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PayerEmailField,
  isValidPayerEmail,
  usePayerEmail,
} from "../PayerEmailField";

function Harness({ sessionEmail }: { sessionEmail: string }) {
  const payer = usePayerEmail(sessionEmail);
  return (
    <div>
      <PayerEmailField {...payer.fieldProps} />
      <button type="button" onClick={() => payer.validate()}>
        validar
      </button>
      <output data-testid="value">{payer.value}</output>
    </div>
  );
}

describe("isValidPayerEmail", () => {
  it("accepts a normal address and rejects malformed ones", () => {
    expect(isValidPayerEmail("a@b.com")).toBe(true);
    expect(isValidPayerEmail("  a@b.com  ")).toBe(true);
    expect(isValidPayerEmail("a@b")).toBe(false);
    expect(isValidPayerEmail("nope")).toBe(false);
    expect(isValidPayerEmail("")).toBe(false);
  });
});

describe("PayerEmailField", () => {
  it("is prefilled with the session email", () => {
    render(<Harness sessionEmail="dueno@local.com" />);
    expect(
      screen.getByLabelText("Email de tu cuenta de Mercado Pago"),
    ).toHaveValue("dueno@local.com");
  });

  it("shows an inline error when validating an invalid email", () => {
    render(<Harness sessionEmail="dueno@local.com" />);
    fireEvent.change(
      screen.getByLabelText("Email de tu cuenta de Mercado Pago"),
      { target: { value: "no-es-un-email" } },
    );
    fireEvent.click(screen.getByText("validar"));
    expect(screen.getByRole("alert")).toHaveTextContent(/email válido/i);
  });
});
