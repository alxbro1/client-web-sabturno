import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocalInfoCard } from "../LocalInfoCard";

describe("LocalInfoCard", () => {
  it("hides the open/hours row when isOpen is null (no schedule)", () => {
    render(
      <LocalInfoCard
        isOpen={null}
        scheduleSummary={null}
        address="Av. Corrientes 1234"
        paymentChips={[]}
      />,
    );

    expect(screen.queryByText("Abierto ahora")).not.toBeInTheDocument();
    expect(screen.queryByText("Cerrado")).not.toBeInTheDocument();
    expect(screen.getByText("Av. Corrientes 1234")).toBeInTheDocument();
  });

  it("shows 'Abierto ahora' and the schedule summary when open", () => {
    render(
      <LocalInfoCard
        isOpen={true}
        scheduleSummary="Mar a Vie 10–20 · Sáb 10–18"
        address="Av. Corrientes 1234"
        paymentChips={[]}
      />,
    );

    expect(screen.getByText("Abierto ahora")).toBeInTheDocument();
    expect(screen.getByText("Mar a Vie 10–20 · Sáb 10–18")).toBeInTheDocument();
  });

  it("shows 'Cerrado' when closed", () => {
    render(
      <LocalInfoCard
        isOpen={false}
        scheduleSummary="Mar a Vie 10–20"
        address="Av. Corrientes 1234"
        paymentChips={[]}
      />,
    );

    expect(screen.getByText("Cerrado")).toBeInTheDocument();
  });

  it("renders only the given payment chips", () => {
    render(
      <LocalInfoCard
        isOpen={null}
        scheduleSummary={null}
        address="Av. Corrientes 1234"
        paymentChips={["Mercado Pago", "Efectivo"]}
      />,
    );

    expect(screen.getByText("Mercado Pago")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.queryByText("Talo")).not.toBeInTheDocument();
  });

  it("renders no chip row when there are none", () => {
    render(
      <LocalInfoCard
        isOpen={null}
        scheduleSummary={null}
        address="Av. Corrientes 1234"
        paymentChips={[]}
      />,
    );

    expect(screen.queryByTestId("payment-chips")).not.toBeInTheDocument();
  });
});
