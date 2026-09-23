import { create } from "zustand";
import type { Local } from "@/lib/types/local";
import { type PaymentMethod, type Service, type TaloPaymentData } from "@/lib/types/booking";
import type { PublicEmployee } from "@/lib/types/employee";

type BookingStoreState = {
  local: Local | null;
  service: Service | null;
  /** null = todavía no elegido; "any" = sin preferencia. */
  employee: PublicEmployee | "any" | null;
  date: string | null;
  time: string | null;
  phoneNumber: string;
  availabilityRefreshToken: number;
  paymentMethod: PaymentMethod | null;
  taloPaymentData: TaloPaymentData | null;
  loyaltyRewardId: string | null;
  loyaltyCouponCode: string;
  setLocal: (local: Local | null) => void;
  setService: (service: Service | null) => void;
  setEmployee: (employee: PublicEmployee | "any" | null) => void;
  setDate: (date: string | null) => void;
  setTime: (time: string | null) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setPaymentMethod: (paymentMethod: PaymentMethod | null) => void;
  setTaloPaymentData: (data: TaloPaymentData | null) => void;
  setLoyaltyRewardId: (rewardId: string | null) => void;
  setLoyaltyCouponCode: (code: string) => void;
  bumpAvailability: () => void;
  resetBooking: () => void;
};

export const useBookingStore = create<BookingStoreState>((set) => ({
  local: null,
  service: null,
  employee: null,
  date: null,
  time: null,
  phoneNumber: "",
  paymentMethod: null,
  taloPaymentData: null,
  loyaltyRewardId: null,
  loyaltyCouponCode: "",
  availabilityRefreshToken: 0,
  setLocal: (local) =>
    set({ local, service: null, employee: null, date: null, time: null, phoneNumber: "", paymentMethod: null, taloPaymentData: null, loyaltyRewardId: null }),
  setService: (service) => set({ service, employee: null, date: null, time: null, paymentMethod: null, taloPaymentData: null, loyaltyRewardId: null }),
  setEmployee: (employee) => set({ employee, date: null, time: null, paymentMethod: null, taloPaymentData: null, loyaltyRewardId: null }),
  setDate: (date) => set({ date, time: null, paymentMethod: null, taloPaymentData: null, loyaltyRewardId: null }),
  setTime: (time) => set({ time, paymentMethod: null, taloPaymentData: null, loyaltyRewardId: null }),
  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setTaloPaymentData: (data) => set({ taloPaymentData: data }),
  setLoyaltyRewardId: (loyaltyRewardId) => set({ loyaltyRewardId }),
  setLoyaltyCouponCode: (loyaltyCouponCode) => set({ loyaltyCouponCode }),
  bumpAvailability: () =>
    set((state) => ({ availabilityRefreshToken: state.availabilityRefreshToken + 1 })),
  resetBooking: () =>
    set({ local: null, service: null, employee: null, date: null, time: null, phoneNumber: "", paymentMethod: null, taloPaymentData: null, loyaltyRewardId: null, loyaltyCouponCode: "", availabilityRefreshToken: 0 }),
}));
