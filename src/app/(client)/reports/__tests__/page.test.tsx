import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: {
    reports: [] as Array<{
      id: number;
      localId: string;
      reason: string;
      description: string;
      status: string;
      createdAt: string;
      local?: { id: string; name: string };
    }>,
    isLoading: false,
    error: null as string | null,
  },
}));

vi.mock("@/hooks/queries/useReportsQuery", () => ({
  useMyReportsQuery: () => ({
    reports: mockQuery.reports,
    isLoading: mockQuery.isLoading,
    error: mockQuery.error,
    createReport: vi.fn(),
    isCreating: false,
  }),
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

import ReportsPage from "@/app/(client)/reports/page";

beforeEach(() => {
  vi.clearAllMocks();
  mockQuery.reports = [];
  mockQuery.isLoading = false;
  mockQuery.error = null;
});

describe("ReportsPage", () => {
  it("shows loading state", () => {
    mockQuery.isLoading = true;

    render(<ReportsPage />);

    expect(screen.getByText("Cargando reportes...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockQuery.error = "Error al cargar reportes";

    render(<ReportsPage />);

    expect(screen.getByText("Error al cargar reportes")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<ReportsPage />);

    expect(screen.getByText("No has enviado reportes")).toBeInTheDocument();
    expect(screen.getByText("Explorar locales")).toBeInTheDocument();
  });

  it("renders report list with reason and status", () => {
    mockQuery.reports = [
      {
        id: 1,
        localId: "local-1",
        reason: "SPAM",
        description: "Spam repetitivo",
        status: "PENDING",
        createdAt: "2026-01-15T00:00:00Z",
        local: { id: "local-1", name: "Test Local" },
      },
      {
        id: 2,
        localId: "local-2",
        reason: "FRAUD",
        description: "Estafa confirmada",
        status: "RESOLVED",
        createdAt: "2026-02-20T00:00:00Z",
        local: { id: "local-2", name: "Otro Local" },
      },
    ];

    render(<ReportsPage />);

    expect(screen.getByText("Test Local")).toBeInTheDocument();
    expect(screen.getByText("Otro Local")).toBeInTheDocument();
    expect(screen.getByText("Spam")).toBeInTheDocument();
    expect(screen.getByText("Fraude")).toBeInTheDocument();
    expect(screen.getByText("Spam repetitivo")).toBeInTheDocument();
    expect(screen.getByText("Estafa confirmada")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Resuelto")).toBeInTheDocument();
  });

  it("renders report without local info", () => {
    mockQuery.reports = [
      {
        id: 1,
        localId: "local-1",
        reason: "OTHER",
        description: "Otro motivo",
        status: "DISMISSED",
        createdAt: "2026-03-10T00:00:00Z",
      },
    ];

    render(<ReportsPage />);

    expect(screen.getByText("Otro")).toBeInTheDocument();
    expect(screen.getByText("Desestimado")).toBeInTheDocument();
    expect(screen.getByText("Otro motivo")).toBeInTheDocument();
  });
});
