import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookingStore } from "@/stores/booking";
import SelectProfessionalPage from "../page";
import type { PublicEmployee } from "@/lib/types/employee";

const { mockReplace, mockPush, mockUsePublicEmployeesQuery } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
  mockUsePublicEmployeesQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

vi.mock("@/hooks/queries/usePublicEmployeesQuery", () => ({
  usePublicEmployeesQuery: mockUsePublicEmployeesQuery,
}));

const LOCAL = { id: "local-1", name: "Peluqueria Centro" } as any;
const SERVICE = { id: 10, name: "Corte", cost: 5000, duration: 30 } as any;

const EMP_1: PublicEmployee = { id: "emp-1", name: "Juan", color: "#00f068", avatar: null };
const EMP_2: PublicEmployee = { id: "emp-2", name: "Maria", color: "#ff5678", avatar: null };

beforeEach(() => {
  vi.clearAllMocks();
  useBookingStore.setState(useBookingStore.getInitialState());
  useBookingStore.setState({ local: LOCAL, service: SERVICE });
});

describe("SelectProfessionalPage: guard", () => {
  it("redirects to select-service when there is no service in the store", () => {
    useBookingStore.setState({ service: null });
    mockUsePublicEmployeesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<SelectProfessionalPage />);

    expect(mockReplace).toHaveBeenCalledWith("/booking/select-service");
  });
});

describe("SelectProfessionalPage: loading and error", () => {
  it("shows a loading state while employees are being fetched", () => {
    mockUsePublicEmployeesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<SelectProfessionalPage />);

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it("shows an error message when the query fails", () => {
    mockUsePublicEmployeesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("No se pudo cargar"),
    });

    render(<SelectProfessionalPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar");
  });
});

describe("SelectProfessionalPage: 0 eligible employees", () => {
  it("auto-assigns 'any' and replaces to /booking/appointment", async () => {
    mockUsePublicEmployeesQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<SelectProfessionalPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/booking/appointment"),
    );
    expect(useBookingStore.getState().employee).toBe("any");
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("SelectProfessionalPage: exactly 1 eligible employee", () => {
  it("auto-selects that employee and replaces to /booking/appointment", async () => {
    mockUsePublicEmployeesQuery.mockReturnValue({
      data: [EMP_1],
      isLoading: false,
      error: null,
    });

    render(<SelectProfessionalPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/booking/appointment"),
    );
    expect(useBookingStore.getState().employee).toEqual(EMP_1);
  });
});

describe("SelectProfessionalPage: 2+ eligible employees", () => {
  beforeEach(() => {
    mockUsePublicEmployeesQuery.mockReturnValue({
      data: [EMP_1, EMP_2],
      isLoading: false,
      error: null,
    });
  });

  it("renders a 'Sin preferencia' card plus one card per employee", () => {
    render(<SelectProfessionalPage />);

    expect(screen.getByRole("button", { name: /sin preferencia/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /juan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /maria/i })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("selecting 'Sin preferencia' sets employee to 'any' and pushes to appointment", () => {
    render(<SelectProfessionalPage />);

    fireEvent.click(screen.getByRole("button", { name: /sin preferencia/i }));

    expect(useBookingStore.getState().employee).toBe("any");
    expect(mockPush).toHaveBeenCalledWith("/booking/appointment");
  });

  it("selecting a specific employee stores it and pushes to appointment", () => {
    render(<SelectProfessionalPage />);

    fireEvent.click(screen.getByRole("button", { name: /juan/i }));

    expect(useBookingStore.getState().employee).toEqual(EMP_1);
    expect(mockPush).toHaveBeenCalledWith("/booking/appointment");
  });
});
