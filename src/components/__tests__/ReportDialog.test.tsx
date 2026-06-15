import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportDialog } from "@/components/ReportDialog";
import { ReportReason } from "@/lib/types/report";

const { mockCreateReport, mockIsCreating } = vi.hoisted(() => ({
  mockCreateReport: vi.fn(),
  mockIsCreating: { value: false },
}));

vi.mock("@/hooks/queries/useReportsQuery", () => ({
  useMyReportsQuery: () => ({
    reports: [],
    isLoading: false,
    error: null,
    createReport: mockCreateReport,
    isCreating: mockIsCreating.value,
  }),
}));

const LOCAL_ID = "local-1";
const LOCAL_NAME = "Test Local";
const onClose = vi.fn();
const onSuccess = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

function renderDialog(isOpen = true) {
  return render(
    <ReportDialog
      isOpen={isOpen}
      localId={LOCAL_ID}
      localName={LOCAL_NAME}
      onClose={onClose}
      onSuccess={onSuccess}
    />,
  );
}

describe("ReportDialog", () => {
  it("renders nothing when isOpen is false", () => {
    renderDialog(false);

    expect(screen.queryByText("Reportar local")).not.toBeInTheDocument();
  });

  it("renders the dialog with local name when open", () => {
    renderDialog(true);

    expect(screen.getByText("Reportar local")).toBeInTheDocument();
    expect(screen.getByText(LOCAL_NAME)).toBeInTheDocument();
    expect(screen.getByText("Enviar reporte")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("shows all reason options in the select", () => {
    renderDialog(true);

    const select = screen.getByLabelText("Motivo");
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    const labels = options.map((o) => o.textContent);
    expect(labels).toContain("Contenido inapropiado");
    expect(labels).toContain("Fraude");
    expect(labels).toContain("Spam");
    expect(labels).toContain("Otro");
  });

  it("shows validation error when description is too short on submit", async () => {
    const user = userEvent.setup();
    renderDialog(true);

    const textarea = screen.getByLabelText("Descripcion");
    await user.type(textarea, "Corto");

    const submitButton = screen.getByText("Enviar reporte");
    await user.click(submitButton);

    expect(
      screen.getByText("La descripcion debe tener al menos 10 caracteres"),
    ).toBeInTheDocument();

    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it("calls createReport on submit with valid data", async () => {
    const user = userEvent.setup();
    mockCreateReport.mockResolvedValue(undefined);
    renderDialog(true);

    const textarea = screen.getByLabelText("Descripcion");
    await user.type(textarea, "Descripcion valida del reporte");

    const submitButton = screen.getByText("Enviar reporte");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateReport).toHaveBeenCalledTimes(1);
      expect(mockCreateReport).toHaveBeenCalledWith({
        localId: LOCAL_ID,
        reason: ReportReason.INAPPROPRIATE_CONTENT,
        description: "Descripcion valida del reporte",
      });
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderDialog(true);

    await user.click(screen.getByText("Cancelar"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables submit button while creating", () => {
    mockIsCreating.value = true;

    renderDialog(true);

    expect(screen.getByText("Enviando...")).toBeInTheDocument();

    mockIsCreating.value = false;
  });

  it("shows error message when createReport fails", async () => {
    const user = userEvent.setup();
    mockCreateReport.mockRejectedValue(
      new Error("No se pudo enviar el reporte. Intenta nuevamente."),
    );
    renderDialog(true);

    const textarea = screen.getByLabelText("Descripcion");
    await user.type(textarea, "Descripcion valida del reporte");

    const submitButton = screen.getByText("Enviar reporte");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No se pudo enviar el reporte. Intenta nuevamente.",
        ),
      ).toBeInTheDocument();
    });
  });
});
