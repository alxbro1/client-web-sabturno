import { beforeEach, describe, expect, it } from "vitest";
import { useBookingStore } from "@/stores/booking";

describe("booking store loyalty reward", () => {
  beforeEach(() => {
    useBookingStore.getState().resetBooking();
  });

  it("starts with no pending reward", () => {
    expect(useBookingStore.getState().pendingLoyaltyRewardId).toBeNull();
  });

  it("sets the pending reward", () => {
    useBookingStore.getState().setPendingLoyaltyRewardId("r1");
    expect(useBookingStore.getState().pendingLoyaltyRewardId).toBe("r1");
  });

  it.each([
    ["setLocal", (s: ReturnType<typeof useBookingStore.getState>) => s.setLocal(null)],
    ["setService", (s: ReturnType<typeof useBookingStore.getState>) => s.setService(null)],
    ["setEmployee", (s: ReturnType<typeof useBookingStore.getState>) => s.setEmployee("any")],
    ["setDate", (s: ReturnType<typeof useBookingStore.getState>) => s.setDate("2026-10-30")],
    ["setTime", (s: ReturnType<typeof useBookingStore.getState>) => s.setTime("10:00")],
  ])("%s clears loyaltyRewardId but preserves pendingLoyaltyRewardId", (_name, act) => {
    useBookingStore.setState({ loyaltyRewardId: "applied", pendingLoyaltyRewardId: "r1" });
    act(useBookingStore.getState());
    expect(useBookingStore.getState().loyaltyRewardId).toBeNull();
    expect(useBookingStore.getState().pendingLoyaltyRewardId).toBe("r1");
  });

  it("resetBooking clears both", () => {
    useBookingStore.setState({ loyaltyRewardId: "applied", pendingLoyaltyRewardId: "r1" });
    useBookingStore.getState().resetBooking();
    expect(useBookingStore.getState().loyaltyRewardId).toBeNull();
    expect(useBookingStore.getState().pendingLoyaltyRewardId).toBeNull();
  });
});
