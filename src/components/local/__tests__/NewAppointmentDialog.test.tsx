import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  MANUAL_APPOINTMENT_ERRORS,
  NewAppointmentDialog,
  resolveManualAppointmentError,
} from "@/components/local/NewAppointmentDialog";
import type { BackendEmployee } from "@/services/timeline";

const { createManualAppointment } = vi.hoisted(() => ({
  createManualAppointment: vi.fn(),
}));

vi.mock("@/services/timeline", () => ({
  timelineService: { createManualAppointment },
}));

vi.mock("@/hooks/queries/useLocalServicesQuery", () => ({
  useLocalServicesQuery: () => ({
    isLoading: false,
    services: [
      { id: 7, name: "Corte", cost: 8500, duration: 30, isActive: true },
      { id: 8, name: "Viejo", cost: 100, duration: 10, isActive: false },
    ],
  }),
}));

vi.mock("@/hooks/queries/useLocalQuery", () => ({
  useLocalQuery: () => ({
    data: { timezone: "America/Argentina/Buenos_Aires" },
  }),
}));

function makeEmployee(overrides: Partial<BackendEmployee> = {}): BackendEmployee {
  return {
    id: "emp-1",
    name: "Lucía",
    isActive: true,
    localId: "local-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof NewAppointmentDialog>> = {},
) {
  const onCreated = vi.fn();
  render(
    <NewAppointmentDialog
      open
      onOpenChange={vi.fn()}
      localId="local-1"
      employees={[]}
      onCreated={onCreated}
      {...props}
    />,
  );
  return { onCreated };
}

function fillForm({ service = "7" } = {}) {
  fireEvent.change(screen.getByLabelText("Servicio"), { target: { value: service } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-12-20" } });
  fireEvent.change(screen.getByLabelText("Hora"), { target: { value: "14:30" } });
  fireEvent.change(screen.getByLabelText("Nombre del cliente"), {
    target: { value: "  Ana Pérez " },
  });
}

describe("NewAppointmentDialog", () => {
  beforeEach(() => {
    createManualAppointment.mockReset();
    createManualAppointment.mockResolvedValue({});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("deshabilita el botón hasta completar servicio, fecha, hora y nombre", () => {
    renderDialog();
    const submit = screen.getByRole("button", { name: "Crear turno" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Servicio"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-12-20" } });
    fireEvent.change(screen.getByLabelText("Hora"), { target: { value: "14:30" } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Nombre del cliente"), {
      target: { value: "Ana" },
    });
    expect(submit).toBeEnabled();
  });

  it("no ofrece servicios inactivos", () => {
    renderDialog();
    expect(screen.queryByRole("option", { name: /Viejo/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Corte/ })).toBeInTheDocument();
  });

  it("envía startDateTime en ISO UTC según la timezone del local", async () => {
    renderDialog();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Crear turno" }));

    await waitFor(() => expect(createManualAppointment).toHaveBeenCalledTimes(1));
    expect(createManualAppointment).toHaveBeenCalledWith({
      localId: "local-1",
      serviceId: 7,
      startDateTime: "2026-12-20T17:30:00.000Z",
      userName: "Ana Pérez",
      timezone: "America/Argentina/Buenos_Aires",
      employeeId: undefined,
    });
  });

  it("envía employeeId al elegir profesional y undefined con 'Sin asignar'", async () => {
    renderDialog({ employees: [makeEmployee()] });
    fillForm();
    fireEvent.change(screen.getByLabelText("Profesional"), { target: { value: "emp-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear turno" }));
    await waitFor(() => expect(createManualAppointment).toHaveBeenCalledTimes(1));
    expect(createManualAppointment.mock.calls[0][0].employeeId).toBe("emp-1");
  });

  it("deja employeeId en undefined si queda 'Sin asignar'", async () => {
    renderDialog({ employees: [makeEmployee()] });
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Crear turno" }));
    await waitFor(() => expect(createManualAppointment).toHaveBeenCalledTimes(1));
    expect(createManualAppointment.mock.calls[0][0].employeeId).toBeUndefined();
  });

  it("no renderiza Profesional sin empleados y sí con uno", () => {
    const { unmount } = render(
      <NewAppointmentDialog
        open
        onOpenChange={vi.fn()}
        localId="local-1"
        employees={[]}
        onCreated={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Profesional")).not.toBeInTheDocument();
    unmount();

    renderDialog({ employees: [makeEmployee()] });
    expect(screen.getByLabelText("Profesional")).toBeInTheDocument();
  });

  it("no renderiza Profesional si todos los empleados están inactivos", () => {
    renderDialog({ employees: [makeEmployee({ isActive: false })] });
    expect(screen.queryByLabelText("Profesional")).not.toBeInTheDocument();
  });

  it("muestra el error mapeado, mantiene el diálogo y no llama onCreated", async () => {
    createManualAppointment.mockRejectedValue({
      response: {
        data: {
          message: "The requested time slot is not available",
          reason: "Time slot conflicts with existing appointments",
        },
      },
    });
    const { onCreated } = renderDialog();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Crear turno" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Ese horario se superpone con otro turno.");
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Crear turno" })).toBeInTheDocument();
  });

  it("llama onCreated una vez al crear con éxito", async () => {
    const { onCreated } = renderDialog();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Crear turno" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  });

  it("muestra la hora de fin calculada con la duración del servicio", () => {
    renderDialog();
    expect(screen.queryByText(/Turno de/)).not.toBeInTheDocument();
    fillForm();
    expect(screen.getByText(/Turno de 14:30 a 15:00/)).toBeInTheDocument();
  });
});

describe("resolveManualAppointmentError", () => {
  it("prioriza reason sobre message", () => {
    expect(
      resolveManualAppointmentError({
        response: {
          data: { message: "userName is required", reason: "Time slot is blocked" },
        },
      }),
    ).toBe(MANUAL_APPOINTMENT_ERRORS["Time slot is blocked"]);
  });

  it("usa message si no hay reason conocido", () => {
    expect(
      resolveManualAppointmentError({
        response: { data: { message: "Cannot create appointments in the past" } },
      }),
    ).toBe("No podés crear un turno en el pasado.");
  });

  it("cae al mensaje genérico", () => {
    expect(resolveManualAppointmentError(new Error("boom"))).toBe(
      "No se pudo crear el turno. Intentá nuevamente.",
    );
  });
});
