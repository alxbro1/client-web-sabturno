import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookingStore } from "@/stores/booking";
import SelectSlotPage from "../page";
import type { PublicEmployee } from "@/lib/types/employee";

const {
  mockReplace,
  mockPush,
  mockUseAvailableDaysQuery,
  mockUseTimeSlotsQuery,
} = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
  mockUseAvailableDaysQuery: vi.fn(),
  mockUseTimeSlotsQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/queries/useAvailableDaysQuery", () => ({
  useAvailableDaysQuery: mockUseAvailableDaysQuery,
}));

vi.mock("@/hooks/queries/useTimeSlotsQuery", () => ({
  useTimeSlotsQuery: mockUseTimeSlotsQuery,
}));

const LOCAL = { id: "local-1", name: "Peluqueria Centro" } as any;
const SERVICE = { id: 10, name: "Corte", cost: 5000, duration: 30 } as any;
const EMPLOYEE: PublicEmployee = { id: "emp-1", name: "Juan", color: "#00f068" };

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAvailableDaysQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  });
  mockUseTimeSlotsQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  });
  useBookingStore.setState(useBookingStore.getInitialState());
  useBookingStore.setState({ local: LOCAL, service: SERVICE });
});

describe("SelectSlotPage: guard for missing employee choice", () => {
  it("redirects to select-professional when employee has not been chosen", () => {
    useBookingStore.setState({ employee: null });

    render(<SelectSlotPage />);

    expect(mockReplace).toHaveBeenCalledWith("/booking/select-professional");
  });
});

describe("SelectSlotPage: passes employeeId to availability hooks", () => {
  it("passes the specific employee id when one was chosen", () => {
    useBookingStore.setState({ employee: EMPLOYEE });

    render(<SelectSlotPage />);

    expect(mockUseAvailableDaysQuery).toHaveBeenCalledWith(
      LOCAL.id,
      SERVICE.id,
      "emp-1",
      0,
    );
    expect(mockUseTimeSlotsQuery).toHaveBeenCalledWith(
      LOCAL.id,
      null,
      SERVICE.duration,
      "emp-1",
      0,
    );
  });

  it("passes 'any' when there is no preference", () => {
    useBookingStore.setState({ employee: "any" });

    render(<SelectSlotPage />);

    expect(mockUseAvailableDaysQuery).toHaveBeenCalledWith(
      LOCAL.id,
      SERVICE.id,
      "any",
      0,
    );
  });
});

describe("SelectSlotPage: professional summary", () => {
  it("shows 'Con <nombre>' when a specific employee was chosen", () => {
    useBookingStore.setState({ employee: EMPLOYEE });

    render(<SelectSlotPage />);

    expect(screen.getByText("Con Juan")).toBeInTheDocument();
  });

  it("shows 'Sin preferencia' when 'any' was chosen", () => {
    useBookingStore.setState({ employee: "any" });

    render(<SelectSlotPage />);

    expect(screen.getByText("Sin preferencia")).toBeInTheDocument();
  });

  it("clicking 'Cambiar' resets employee and navigates to select-professional", () => {
    useBookingStore.setState({ employee: EMPLOYEE });

    render(<SelectSlotPage />);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(useBookingStore.getState().employee).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/booking/select-professional");
  });
});
