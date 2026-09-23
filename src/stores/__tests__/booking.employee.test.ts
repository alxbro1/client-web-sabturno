import { beforeEach, describe, expect, it } from "vitest";
import { useBookingStore } from "@/stores/booking";
import type { PublicEmployee } from "@/lib/types/employee";
import type { Local } from "@/lib/types/local";
import type { Service } from "@/lib/types/booking";

const LOCAL = { id: "local-1", name: "Peluqueria Centro" } as Local;
const SERVICE = { id: 10, name: "Corte", cost: 5000, duration: 30 } as Service;
const EMPLOYEE: PublicEmployee = { id: "emp-1", name: "Juan", color: "#00f068" };

beforeEach(() => {
  useBookingStore.setState(useBookingStore.getInitialState());
});

describe("useBookingStore employee field", () => {
  it("starts as null (not chosen yet)", () => {
    expect(useBookingStore.getState().employee).toBeNull();
  });

  it("setEmployee stores a specific PublicEmployee", () => {
    useBookingStore.getState().setEmployee(EMPLOYEE);
    expect(useBookingStore.getState().employee).toEqual(EMPLOYEE);
  });

  it("setEmployee stores 'any' for no preference", () => {
    useBookingStore.getState().setEmployee("any");
    expect(useBookingStore.getState().employee).toBe("any");
  });

  it("setEmployee resets date and time (downstream fields)", () => {
    useBookingStore.setState({ date: "2026-10-01", time: "10:00" });
    useBookingStore.getState().setEmployee(EMPLOYEE);

    expect(useBookingStore.getState().date).toBeNull();
    expect(useBookingStore.getState().time).toBeNull();
  });

  it("setLocal resets employee to null", () => {
    useBookingStore.getState().setEmployee(EMPLOYEE);
    useBookingStore.getState().setLocal(LOCAL);

    expect(useBookingStore.getState().employee).toBeNull();
  });

  it("setService resets employee to null", () => {
    useBookingStore.getState().setEmployee(EMPLOYEE);
    useBookingStore.getState().setService(SERVICE);

    expect(useBookingStore.getState().employee).toBeNull();
  });

  it("resetBooking resets employee to null", () => {
    useBookingStore.getState().setEmployee(EMPLOYEE);
    useBookingStore.getState().resetBooking();

    expect(useBookingStore.getState().employee).toBeNull();
  });
});
