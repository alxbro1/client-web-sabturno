import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useBookingStore } from "@/stores/booking";
import { BookingSummary } from "../BookingSummary";
import type { PublicEmployee } from "@/lib/types/employee";

const LOCAL = { id: "local-1", name: "Peluqueria Centro" } as any;
const SERVICE = { id: 10, name: "Corte", cost: 5000, duration: 30 } as any;
const EMPLOYEE: PublicEmployee = { id: "emp-1", name: "Juan", color: "#00f068" };

beforeEach(() => {
  useBookingStore.setState(useBookingStore.getInitialState());
  useBookingStore.setState({ local: LOCAL, service: SERVICE });
});

describe("BookingSummary: profesional elegido", () => {
  it("shows 'Con <nombre>' when a specific employee was chosen", () => {
    useBookingStore.setState({ employee: EMPLOYEE });

    render(<BookingSummary />);

    expect(screen.getByText("Con Juan")).toBeInTheDocument();
  });

  it("shows 'Sin preferencia' when 'any' was chosen", () => {
    useBookingStore.setState({ employee: "any" });

    render(<BookingSummary />);

    expect(screen.getByText("Sin preferencia")).toBeInTheDocument();
  });

  it("shows nothing about the professional when not chosen yet", () => {
    useBookingStore.setState({ employee: null });

    render(<BookingSummary />);

    expect(screen.queryByText("Sin preferencia")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Con /)).not.toBeInTheDocument();
  });
});
