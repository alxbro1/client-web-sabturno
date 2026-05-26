import { create } from "zustand";
import type { Local } from "@/lib/types/local";
import { type PaymentMethod, type Service, type TaloPaymentData } from "@/lib/types/booking";

type BookingStoreState = {
  local: Local | null;
  service: Service | null;
  date: string | null;
  time: string | null;
  availabilityRefreshToken: number;
  paymentMethod: PaymentMethod | null;
  taloPaymentData: TaloPaymentData | null;
  setLocal: (local: Local | null) => void;
  setService: (service: Service | null) => void;
  setDate: (date: string | null) => void;
  setTime: (time: string | null) => void;
  setPaymentMethod: (paymentMethod: PaymentMethod | null) => void;
  setTaloPaymentData: (data: TaloPaymentData | null) => void;
  bumpAvailability: () => void;
  resetBooking: () => void;
};

export const useBookingStore = create<BookingStoreState>((set) => ({
  local: null,
  service: null,
  date: null,
  time: null,
  paymentMethod: null,
  taloPaymentData: null,
  availabilityRefreshToken: 0,
  setLocal: (local) =>
    set({ local, service: null, date: null, time: null, paymentMethod: null, taloPaymentData: null }),
  setService: (service) => set({ service, date: null, time: null, paymentMethod: null, taloPaymentData: null }),
  setDate: (date) => set({ date, time: null, paymentMethod: null, taloPaymentData: null }),
  setTime: (time) => set({ time, paymentMethod: null, taloPaymentData: null }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setTaloPaymentData: (data) => set({ taloPaymentData: data }),
  bumpAvailability: () =>
    set((state) => ({ availabilityRefreshToken: state.availabilityRefreshToken + 1 })),
  resetBooking: () =>
    set({ local: null, service: null, date: null, time: null, paymentMethod: null, taloPaymentData: null, availabilityRefreshToken: 0 }),
}));