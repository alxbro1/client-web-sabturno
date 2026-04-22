import { create } from "zustand";
import type { Local } from "@/lib/types/local";
import { type PaymentMethod, type Service } from "@/lib/types/booking";

type BookingStoreState = {
  local: Local | null;
  service: Service | null;
  date: string | null;
  time: string | null;
  availabilityRefreshToken: number;
  paymentMethod: PaymentMethod | null;
  setLocal: (local: Local | null) => void;
  setService: (service: Service | null) => void;
  setDate: (date: string | null) => void;
  setTime: (time: string | null) => void;
  setPaymentMethod: (paymentMethod: PaymentMethod | null) => void;
  bumpAvailability: () => void;
  resetBooking: () => void;
};

export const useBookingStore = create<BookingStoreState>((set) => ({
  local: null,
  service: null,
  date: null,
  time: null,
  paymentMethod: null,
  availabilityRefreshToken: 0,
  setLocal: (local) =>
    set({ local, service: null, date: null, time: null, paymentMethod: null }),
  setService: (service) => set({ service, date: null, time: null, paymentMethod: null }),
  setDate: (date) => set({ date, time: null, paymentMethod: null }),
  setTime: (time) => set({ time, paymentMethod: null }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  bumpAvailability: () =>
    set((state) => ({ availabilityRefreshToken: state.availabilityRefreshToken + 1 })),
  resetBooking: () =>
    set({ local: null, service: null, date: null, time: null, paymentMethod: null }),
}));