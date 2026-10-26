import { describe, expect, it } from "vitest";
import type { LoyaltyReward } from "@/lib/types/loyalty";
import { calculateRewardDiscount, isRewardUsable } from "@/lib/utils/loyalty";

function reward(overrides: Partial<LoyaltyReward> = {}): LoyaltyReward {
  return {
    id: "r1",
    code: "ABC",
    type: "FIXED_DISCOUNT",
    value: 0,
    status: "AVAILABLE",
    ...overrides,
  };
}

describe("calculateRewardDiscount", () => {
  it("discounts the whole cost for a free service", () => {
    expect(calculateRewardDiscount(5000, reward({ type: "FREE_SERVICE" }))).toBe(5000);
  });

  it("applies a percentage", () => {
    expect(
      calculateRewardDiscount(1000, reward({ type: "PERCENTAGE_DISCOUNT", value: 25 })),
    ).toBe(250);
  });

  it("clamps the percentage at 0 and 100", () => {
    expect(
      calculateRewardDiscount(1000, reward({ type: "PERCENTAGE_DISCOUNT", value: -10 })),
    ).toBe(0);
    expect(
      calculateRewardDiscount(1000, reward({ type: "PERCENTAGE_DISCOUNT", value: 150 })),
    ).toBe(1000);
  });

  it("caps a fixed discount at the service cost", () => {
    expect(calculateRewardDiscount(1000, reward({ type: "FIXED_DISCOUNT", value: 300 }))).toBe(300);
    expect(calculateRewardDiscount(1000, reward({ type: "FIXED_DISCOUNT", value: 5000 }))).toBe(1000);
  });

  it("treats a null or undefined value as 0", () => {
    expect(calculateRewardDiscount(1000, reward({ type: "FIXED_DISCOUNT", value: null }))).toBe(0);
    expect(calculateRewardDiscount(1000, reward({ type: "PERCENTAGE_DISCOUNT", value: undefined }))).toBe(0);
  });
});

describe("isRewardUsable", () => {
  const now = new Date("2026-10-25T12:00:00Z");

  it("accepts an AVAILABLE reward with no expiry", () => {
    expect(isRewardUsable(reward({ expiresAt: null }), now)).toBe(true);
    expect(isRewardUsable(reward(), now)).toBe(true);
  });

  it("rejects an AVAILABLE reward already past its expiry", () => {
    expect(isRewardUsable(reward({ expiresAt: "2026-10-24T12:00:00Z" }), now)).toBe(false);
  });

  it("accepts an AVAILABLE reward with a future expiry", () => {
    expect(isRewardUsable(reward({ expiresAt: "2026-11-01T12:00:00Z" }), now)).toBe(true);
  });

  it("rejects REDEEMED and EXPIRED rewards", () => {
    expect(isRewardUsable(reward({ status: "REDEEMED" }), now)).toBe(false);
    expect(isRewardUsable(reward({ status: "EXPIRED" }), now)).toBe(false);
  });
});
