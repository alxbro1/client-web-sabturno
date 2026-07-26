import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppointmentDetailsDialog } from "@/components/local/AppointmentDetailsDialog";
import type { Appointment } from "@/features/appointment-timeline/types";

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "42",
    resourceId: "employee-1",
    startAt: new Date(Date.now() + 86_400_000),
    endAt: new Date(Date.now() + 90_000_000),
    title: "Corte",
    status: "PENDING",
    customerName: "Ana Pérez",
    customerEmail: "ana@example.com",
    customerPhone: "3515555555",
    serviceName: "Corte de pelo",
    price: 8500,
    paymentMethod: "CASH_IN_FRONT",
    timezone: "America/Argentina/Buenos_Aires",
    ...overrides,
  };
}

const resources = [{ id: "employee-1", name: "Lucía" }];

describe("AppointmentDetailsDialog", () => {
  it("renders appointment details and available actions", () => {
    render(
      <AppointmentDetailsDialog
        appointment={makeAppointment()}
        resources={resources}
        isMutating={false}
        mutationError={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Ana Pérez")).toBeTruthy();
    expect(screen.getByText("Corte de pelo")).toBeTruthy();
    expect(screen.getByText("Lucía")).toBeTruthy();
    expect(screen.getByText("Efectivo en el local")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirmar turno" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar turno" })).toBeTruthy();
  });

  it("requires a second confirmation before confirming", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <AppointmentDetailsDialog
        appointment={makeAppointment()}
        resources={resources}
        isMutating={false}
        mutationError={null}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirmar turno" }));
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sí, confirmar" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("hides actions for completed appointments and shows mutation errors", () => {
    render(
      <AppointmentDetailsDialog
        appointment={makeAppointment({ status: "COMPLETED" })}
        resources={resources}
        isMutating={false}
        mutationError="No se pudo actualizar el turno."
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Confirmar turno" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancelar turno" })).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(
      "No se pudo actualizar el turno.",
    );
  });

  it("only offers cancellation for a confirmed future appointment", () => {
    render(
      <AppointmentDetailsDialog
        appointment={makeAppointment({
          status: "CONFIRMED",
          paymentMethod: "MERCADO_PAGO",
        })}
        resources={resources}
        isMutating={false}
        mutationError={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Confirmar turno" })).toBeNull();
    expect(screen.getByRole("button", { name: "Cancelar turno" })).toBeTruthy();
  });
});
