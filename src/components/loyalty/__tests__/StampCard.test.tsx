import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StampCard } from "../StampCard";
import type { LoyaltyCard } from "@/lib/types/loyalty";

function cardFixture(overrides: Partial<LoyaltyCard> = {}): LoyaltyCard {
  return {
    id: "card-1",
    localId: "local-1",
    stampsBalance: 2,
    totalStampsEarned: 2,
    status: "ACTIVE",
    expiresAt: "2027-03-15T12:00:00.000Z",
    local: { id: "local-1", name: "Peluqueria Centro" },
    program: {
      id: "program-1",
      localId: "local-1",
      name: "Tarjeta de fidelidad",
      status: "ACTIVE",
      revisions: [],
      services: [],
    },
    revision: {
      id: "rev-1",
      version: 1,
      stampsRequired: 6,
      stampsPerAppointment: 1,
      rewardType: "FREE_SERVICE",
      rewardValue: null,
      rewardServiceId: 10,
    },
    rewards: [],
    ...overrides,
  };
}

describe("StampCard", () => {
  it("dibuja un sello por cada visita requerida y cuenta las completadas", () => {
    render(<StampCard card={cardFixture()} />);

    expect(
      screen.getByLabelText("2 de 6 sellos completados"),
    ).toBeInTheDocument();
    expect(screen.getByText("Te faltan 4 sellos")).toBeInTheDocument();
    expect(
      screen.getByText("Al completar 6 sellos, ganás un servicio gratis."),
    ).toBeInTheDocument();
  });

  it("no repite el encabezado cuando el programa usa el nombre por defecto", () => {
    render(<StampCard card={cardFixture()} />);

    // "Tarjeta de fidelidad" ya está en el eyebrow: repetirlo como nombre del
    // programa era ruido.
    expect(screen.getAllByText("Tarjeta de fidelidad")).toHaveLength(1);
    expect(screen.getByText("Peluqueria Centro")).toBeInTheDocument();
  });

  it("muestra el vencimiento de la tarjeta", () => {
    render(<StampCard card={cardFixture()} />);

    expect(
      screen.getByText(/Tu tarjeta vence el 15 de marzo de 2027\./),
    ).toBeInTheDocument();
  });

  it("muestra el vencimiento de cada beneficio disponible", () => {
    render(
      <StampCard
        card={cardFixture({
          rewards: [
            {
              id: "reward-1",
              code: "ABC123",
              type: "FREE_SERVICE",
              value: null,
              serviceId: 10,
              status: "AVAILABLE",
              expiresAt: "2026-12-01T12:00:00.000Z",
              service: { id: 10, name: "Corte" },
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Corte gratis")).toBeInTheDocument();
    expect(
      screen.getByText(/Válido hasta el 1 de diciembre de 2026/),
    ).toBeInTheDocument();
  });

  it("renderiza el CTA que le pasa la pantalla", () => {
    render(
      <StampCard
        card={cardFixture()}
        footer={<a href="/booking/select-service">Reservar mi próximo turno</a>}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Reservar mi próximo turno" }),
    ).toHaveAttribute("href", "/booking/select-service");
  });

  describe("beneficios usables", () => {
    const reward = (id: string, overrides = {}) => ({
      id,
      code: `CODE-${id}`,
      type: "FREE_SERVICE" as const,
      value: null,
      serviceId: 10,
      status: "AVAILABLE" as const,
      expiresAt: null,
      service: { id: 10, name: "Corte" },
      ...overrides,
    });

    it("llama a renderRewardAction una vez por beneficio usable", () => {
      const renderRewardAction = vi.fn((r: { id: string }) => (
        <button>Usar {r.id}</button>
      ));
      render(
        <StampCard
          card={cardFixture({ rewards: [reward("r1"), reward("r2")] })}
          renderRewardAction={renderRewardAction}
        />,
      );

      expect(renderRewardAction).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("button", { name: "Usar r1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Usar r2" })).toBeInTheDocument();
      expect(
        screen.getByText("Tenés 2 beneficios listos para usar"),
      ).toBeInTheDocument();
    });

    it("excluye un beneficio AVAILABLE ya vencido del conteo y de las tarjetas", () => {
      const renderRewardAction = vi.fn(() => <span>accion</span>);
      render(
        <StampCard
          card={cardFixture({
            rewards: [
              reward("vivo"),
              reward("vencido", { expiresAt: "2020-01-01T12:00:00.000Z" }),
            ],
          })}
          renderRewardAction={renderRewardAction}
        />,
      );

      expect(renderRewardAction).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText("Tenés un beneficio listo para usar"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("Corte gratis")).toHaveLength(1);
    });

    it("no muestra la sección si el único beneficio está vencido", () => {
      render(
        <StampCard
          card={cardFixture({
            rewards: [reward("vencido", { expiresAt: "2020-01-01T12:00:00.000Z" })],
          })}
        />,
      );

      expect(screen.queryByText(/listo para usar|listos para usar/)).toBeNull();
    });

    it("sin renderRewardAction el render no cambia", () => {
      const withoutProp = render(
        <StampCard card={cardFixture({ rewards: [reward("r1")] })} />,
      );
      const html = withoutProp.container.innerHTML;
      withoutProp.unmount();
      const withUndefined = render(
        <StampCard
          card={cardFixture({ rewards: [reward("r1")] })}
          renderRewardAction={undefined}
        />,
      );

      expect(withUndefined.container.innerHTML).toBe(html);
      expect(screen.queryByRole("button")).toBeNull();
    });
  });
});
