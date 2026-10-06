import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Los textos con interpolaciones ({a} · {b}) quedan partidos en varios nodos de
 * texto, así que `getByText` no los matchea. Se busca por `textContent` y se
 * queda con el ÚLTIMO elemento en orden de documento, que es el más interno:
 * el padre también contiene el texto y sin esto matchea todo el árbol.
 */
function hasText(re: RegExp) {
  return (_: string, element: Element | null) =>
    !!element && re.test(element.textContent ?? "");
}

function findText(re: RegExp) {
  return screen.getAllByText(hasText(re)).at(-1)!;
}
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MonthlyScheduleClient } from "../MonthlyScheduleClient";

const { mockSchedules, mockEmployees, mockLocal } = vi.hoisted(() => ({
  mockSchedules: {
    templates: [] as any[],
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
    saveMonth: vi.fn(),
    removeMonth: vi.fn(),
    isSaving: false,
    isRemoving: false,
  },
  mockEmployees: [] as any[],
  mockLocal: { timezone: "America/Argentina/Buenos_Aires" },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "local-1", isLocal: true } }),
}));

vi.mock("@/hooks/queries/useLocalQuery", () => ({
  useLocalQuery: () => ({ data: mockLocal }),
}));

vi.mock("@/hooks/queries/useEmployeesQuery", () => ({
  useEmployeesQuery: () => ({ employees: mockEmployees, isLoading: false }),
}));

vi.mock("@/hooks/queries/useMonthlyScheduleQuery", () => ({
  useMonthlyScheduleQuery: () => mockSchedules,
}));

vi.mock("@/components/shadcn-big-calendar/shadcn-big-calendar.css", () => ({}));

/**
 * Stub del calendario: reproduce las DOS vías por las que se abre un día en el
 * mes view de react-big-calendar, porque son handlers distintos:
 *  - `onSelectSlot`  → click en el espacio de la celda
 *  - `onDrillDown`   → click en el botón del número (`.rbc-button-link`)
 */
vi.mock("@/components/shadcn-big-calendar/shadcn-big-calendar", () => ({
  default: ({
    onSelectSlot,
    onDrillDown,
  }: {
    onSelectSlot: (slot: { start: Date }) => void;
    onDrillDown: (date: Date) => void;
  }) => (
    <div data-testid="calendar-stub">
      <button
        type="button"
        onClick={() => onSelectSlot({ start: new Date(2026, 0, 15) })}
      >
        stub-dia-15
      </button>
      <button type="button" onClick={() => onDrillDown(new Date(2026, 0, 15))}>
        stub-numero-15
      </button>
      <button
        type="button"
        onClick={() => onSelectSlot({ start: new Date(2026, 0, 16) })}
      >
        stub-dia-16
      </button>
    </div>
  ),
}));

const CONFIRM = "Reemplazar el horario de Enero";

/** Mes propio de todo el local (`employeeId: null`) ya configurado. */
function wholeLocalTemplate() {
  return {
    id: "tpl-local-1",
    localId: "local-1",
    employeeId: null,
    year: 2026,
    month: 1,
    isActive: true,
    days: [
      {
        date: "2026-01-15",
        isClosed: false,
        slots: [{ startTime: "09:00", endTime: "13:00" }],
      },
    ],
  };
}

function renderClient() {
  return render(<MonthlyScheduleClient />);
}

async function openDayEditor() {
  fireEvent.click(screen.getByText("stub-dia-15"));
  await screen.findByRole("button", { name: "Abierto" });
}

/**
 * El editor del día es un MODAL: mientras está abierto, Radix marca el resto de
 * la página con `aria-hidden="true"` y su overlay tapa los botones de fondo
 * (getByRole no los encuentra). El flujo real cierra el modal con la X antes de
 * tocar "Guardar horario del mes" / "Desactivar el mes".
 */
function closeDayEditor() {
  fireEvent.click(screen.getByRole("button", { name: "Cerrar editor del día" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 0, 15, 12));
  mockSchedules.templates = [];
  mockSchedules.isLoading = false;
  mockSchedules.error = null;
  mockSchedules.isSaving = false;
  mockSchedules.isRemoving = false;
  mockSchedules.saveMonth.mockResolvedValue(undefined);
  mockSchedules.removeMonth.mockResolvedValue(undefined);
  mockEmployees.length = 0;
});

describe("MonthlyScheduleClient - estado inicial del mes", () => {
  it("arranca con todos los días cerrados cuando el mes no está configurado", async () => {
    renderClient();

    await waitFor(() => {
      expect(
        screen.getByText(/todos arrancan cerrados/),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/0 días abiertos · 31 cerrados/)).toBeInTheDocument();
  });

  it("carga los días del template configurado para el mes visible", async () => {
    mockSchedules.templates = [
      {
        id: "tpl-1",
        localId: "local-1",
        employeeId: null,
        year: 2026,
        month: 1,
        isActive: true,
        days: [
          {
            id: "day-15",
            date: "2026-01-15",
            isClosed: false,
            slots: [{ id: "s1", startTime: "09:00", endTime: "13:00" }],
          },
        ],
      },
    ];

    renderClient();

    await waitFor(() => {
      expect(findText(/1 días abiertos · 30 cerrados/)).toBeInTheDocument();
    });
    expect(findText(/tiene un horario propio para todo el local/)).toBeInTheDocument();
  });
});

describe("MonthlyScheduleClient - editor del día", () => {
  it("exige al menos una franja en un día abierto", async () => {
    renderClient();
    await openDayEditor();

    fireEvent.click(screen.getByRole("button", { name: "Abierto" }));
    fireEvent.click(screen.getByRole("button", { name: "Quitar franja 1" }));

    expect(
      screen.getByText("Un día abierto necesita al menos una franja horaria."),
    ).toBeInTheDocument();

    closeDayEditor();
    expect(screen.getByRole("button", { name: /Guardar horario del mes/ })).toBeDisabled();
  });

  it("abre el editor también al tocar el número del día", async () => {
    renderClient();

    fireEvent.click(screen.getByText("stub-numero-15"));

    expect(await screen.findByRole("button", { name: "Abierto" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /15 de enero/i })).toBeInTheDocument();
  });

  it("avisa que marcar un día cerrado no cancela los turnos ya reservados", async () => {
    renderClient();
    await openDayEditor();

    expect(
      screen.getByText(/no cancela los turnos ya reservados/),
    ).toBeInTheDocument();
  });

  it("rechaza una franja que termina antes de empezar", async () => {
    renderClient();
    await openDayEditor();

    fireEvent.click(screen.getByRole("button", { name: "Abierto" }));
    fireEvent.change(screen.getByLabelText("Desde (franja 1)"), {
      target: { value: "13:00" },
    });
    fireEvent.change(screen.getByLabelText("Hasta (franja 1)"), {
      target: { value: "09:00" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      /termina antes o junto a la hora de inicio/,
    );
  });

  it("rechaza franjas superpuestas", async () => {
    renderClient();
    await openDayEditor();

    fireEvent.click(screen.getByRole("button", { name: "Abierto" }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar franja" }));
    fireEvent.change(screen.getByLabelText("Desde (franja 2)"), {
      target: { value: "12:00" },
    });
    fireEvent.change(screen.getByLabelText("Hasta (franja 2)"), {
      target: { value: "15:00" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/se superponen/);
  });
});

describe("MonthlyScheduleClient - guardado", () => {
  it("envía los 31 días del mes, con los cerrados explícitos y sin slots", async () => {
    renderClient();
    await openDayEditor();

    fireEvent.click(screen.getByRole("button", { name: "Abierto" }));
    closeDayEditor();
    fireEvent.click(screen.getByRole("button", { name: /Guardar horario del mes/ }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Guardar horario" }),
    );

    await waitFor(() => expect(mockSchedules.saveMonth).toHaveBeenCalledTimes(1));

    const payload = mockSchedules.saveMonth.mock.calls[0][0];
    expect(payload.year).toBe(2026);
    expect(payload.month).toBe(1);
    expect(payload.employeeId).toBeNull();
    expect(payload.days).toHaveLength(31);

    const day15 = payload.days.find((day: any) => day.date === "2026-01-15");
    expect(day15).toEqual({
      date: "2026-01-15",
      isClosed: false,
      slots: [{ startTime: "09:00", endTime: "13:00" }],
    });

    const closedDays = payload.days.filter((day: any) => day.date !== "2026-01-15");
    expect(closedDays).toHaveLength(30);
    closedDays.forEach((day: any) => {
      expect(day).toEqual({ date: day.date, isClosed: true, slots: [] });
    });
  });

  it("confirma con el detalle del reemplazo y la advertencia de turnos", async () => {
    renderClient();
    await openDayEditor();
    fireEvent.click(screen.getByRole("button", { name: "Abierto" }));
    closeDayEditor();
    fireEvent.click(screen.getByRole("button", { name: /Guardar horario del mes/ }));

    const dialog = await screen.findByText(/Se reemplazan los 31 días/);
    expect(dialog).toHaveTextContent(
      /no cancela los turnos ya reservados/,
    );
    expect(
      findText(/1 abiertos con horario y 30 cerrados/),
    ).toBeInTheDocument();
  });

  /**
   * Regresión: `Guardar horario del mes` y `Desactivar el mes` compartían un
   * único booleano de diálogo, así que sobre un mes propio de todo el local el
   * botón de guardar abría el diálogo destructivo y terminaba en DELETE.
   */
  it("guarda, sin borrar, cuando el mes propio de todo el local ya existe", async () => {
    mockSchedules.templates = [wholeLocalTemplate()];

    renderClient();
    await openDayEditor();
    fireEvent.click(screen.getByRole("button", { name: "Abierto" }));
    closeDayEditor();
    fireEvent.click(screen.getByRole("button", { name: /Guardar horario del mes/ }));

    // El diálogo es el de reemplazo, no el destructivo.
    expect(await screen.findByText(/Se reemplazan los 31 días/)).toBeInTheDocument();
    expect(screen.queryByText(/vuelve a seguir el horario semanal/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Guardar horario" }));

    await waitFor(() => expect(mockSchedules.saveMonth).toHaveBeenCalledTimes(1));
    expect(mockSchedules.removeMonth).not.toHaveBeenCalled();
  });

  it("desactiva sólo cuando se pide explícitamente", async () => {
    mockSchedules.templates = [wholeLocalTemplate()];

    renderClient();
    await openDayEditor();
    closeDayEditor();
    fireEvent.click(screen.getByRole("button", { name: "Desactivar el mes" }));

    expect(
      await screen.findByText(/vuelve a seguir el horario semanal/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(mockSchedules.removeMonth).toHaveBeenCalledTimes(1));
    expect(mockSchedules.saveMonth).not.toHaveBeenCalled();
  });

  /**
   * Regresión: `canSave` miraba sólo el día abierto en el editor, así que un
   * día inválido en otra celda dejaba el botón habilitado y el guardado fallaba
   * contra el backend.
   */
  it("bloquea el guardado si algún día no visible quedó inválido", async () => {
    renderClient();
    await openDayEditor();
    fireEvent.click(screen.getByRole("button", { name: "Abierto" }));

    // Se abre el día 16 y se vuelve al 15 sin corregir el 16.
    fireEvent.click(screen.getByText("stub-dia-16"));
    await screen.findByRole("button", { name: "Abierto" });
    fireEvent.click(screen.getByRole("button", { name: "Abierto" }));
    const end16 = screen.getByLabelText("Hasta (franja 1)");
    fireEvent.change(end16, { target: { value: "08:00" } });
    expect(await screen.findByText(/termina antes o junto/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("stub-dia-15"));
    await screen.findByRole("button", { name: "Abierto" });

    closeDayEditor();
    expect(screen.getByRole("button", { name: /Guardar horario del mes/ })).toBeDisabled();
  });

  it("muestra un error visible cuando el guardado falla", async () => {
    mockSchedules.saveMonth.mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderClient();
    await openDayEditor();
    closeDayEditor();
    fireEvent.click(screen.getByRole("button", { name: /Guardar horario del mes/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Guardar horario" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /No pudimos guardar el horario del mes/,
    );
    spy.mockRestore();
  });

  it("muestra el error del listado con su reintento, sin comerse el fallo", async () => {
    mockSchedules.error = "Network Error";
    renderClient();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/No pudimos leer los meses configurados/);
    expect(findText(/todos arrancan cerrados/)).toBeInTheDocument();
  });
});

describe("MonthlyScheduleClient - alcance por empleado", () => {
  it("ofrece el selector de empleado cuando el local tiene empleados", async () => {
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });

    renderClient();

    expect(screen.getByLabelText("Empleado")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Todo el local" })).toBeInTheDocument();
  });

  it("no ofrece el selector cuando el local no tiene empleados", () => {
    renderClient();

    expect(screen.queryByLabelText("Empleado")).not.toBeInTheDocument();
  });

  it("ignora el mes de un empleado cuando el alcance es todo el local", async () => {
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });
    mockSchedules.templates = [
      {
        id: "tpl-emp",
        localId: "local-1",
        employeeId: "emp-1",
        year: 2026,
        month: 1,
        isActive: true,
        days: [],
      },
    ];

    renderClient();

    expect(
      findText(/Enero todavía no tiene horario propio para todo el local/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Desactivar el mes" }),
    ).not.toBeInTheDocument();
  });

  it("no ofrece desactivar el mes cuando el alcance es un empleado", async () => {
    mockEmployees.push({ id: "emp-1", name: "Ana", isActive: true });
    mockSchedules.templates = [
      {
        id: "tpl-emp",
        localId: "local-1",
        employeeId: "emp-1",
        year: 2026,
        month: 1,
        isActive: true,
        days: [],
      },
    ];

    renderClient();

    fireEvent.change(screen.getByLabelText("Empleado"), {
      target: { value: "emp-1" },
    });

    await waitFor(() => {
      expect(findText(/tiene un horario propio para Ana/)).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "Desactivar el mes" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Sólo se puede desactivar el horario del mes/)).toBeInTheDocument();
  });
});