import { describe, expect, it } from "vitest";
import {
  buildBookingSearch,
  buildGuestRewardBookingPath,
  buildLocalBookingPath,
  buildUserRewardBookingPath,
  parseBookingQuery,
} from "@/lib/utils/bookingQuery";

function toBk(payload: object) {
  return btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

describe("parseBookingQuery reward", () => {
  it("round trips rewardId through buildBookingSearch", () => {
    const search = buildBookingSearch({ localId: "a", serviceId: 2, rewardId: "r1" });
    expect(parseBookingQuery(new URLSearchParams(search))).toEqual({
      localId: "a",
      serviceId: 2,
      coupon: null,
      rewardId: "r1",
    });
  });

  it("reads reward from legacy params", () => {
    expect(parseBookingQuery(new URLSearchParams("localId=a&serviceId=2&reward=r1"))).toEqual({
      localId: "a",
      serviceId: 2,
      coupon: null,
      rewardId: "r1",
    });
  });

  it("falls back to legacy params and still reads reward when bk is malformed", () => {
    const parsed = parseBookingQuery(new URLSearchParams("bk=%%%&localId=a&reward=r1"));
    expect(parsed.localId).toBe("a");
    expect(parsed.rewardId).toBe("r1");
  });

  it("returns null rewardId when absent or blank", () => {
    expect(parseBookingQuery(new URLSearchParams(`bk=${toBk({ l: "a" })}`)).rewardId).toBeNull();
    expect(parseBookingQuery(new URLSearchParams("localId=a&reward=%20")).rewardId).toBeNull();
  });
});

describe("buildBookingSearch", () => {
  it("emits the same string as before when there is no rewardId", () => {
    expect(buildBookingSearch({ localId: "a", serviceId: 2, coupon: "X1" })).toBe(
      "bk=eyJsIjoiYSIsInMiOjJ9&coupon=X1",
    );
    expect(buildBookingSearch({ localId: "a" })).toBe("bk=eyJsIjoiYSJ9");
  });

  it("keeps reward outside the bk token", () => {
    expect(buildBookingSearch({ localId: "a", rewardId: "r1" })).toBe("bk=eyJsIjoiYSJ9&reward=r1");
  });

  it("returns empty for an empty payload but not for rewardId alone", () => {
    expect(buildBookingSearch({})).toBe("");
    expect(buildBookingSearch({ rewardId: "r1" })).not.toBe("");
  });
});

describe("reward booking paths", () => {
  it("builds the user path with and without serviceId", () => {
    expect(buildUserRewardBookingPath({ id: "r1", serviceId: 2 }, "a")).toBe(
      "/booking/select-service?bk=eyJsIjoiYSIsInMiOjJ9&reward=r1",
    );
    expect(buildUserRewardBookingPath({ id: "r1", serviceId: null }, "a")).toBe(
      "/booking/select-service?bk=eyJsIjoiYSJ9&reward=r1",
    );
    expect(buildUserRewardBookingPath({ id: "r1" }, "a")).toBe(
      "/booking/select-service?bk=eyJsIjoiYSJ9&reward=r1",
    );
  });

  it("builds the guest path with coupon and never reward", () => {
    const withService = buildGuestRewardBookingPath({ code: "ABC", serviceId: 2 }, "a");
    expect(withService).toBe("/booking/select-service?bk=eyJsIjoiYSIsInMiOjJ9&coupon=ABC");
    const without = buildGuestRewardBookingPath({ code: "ABC", serviceId: null }, "a");
    expect(without).toBe("/booking/select-service?bk=eyJsIjoiYSJ9&coupon=ABC");
    expect(withService).not.toContain("reward=");
    expect(without).not.toContain("reward=");
  });

  it("leaves buildLocalBookingPath unchanged", () => {
    expect(buildLocalBookingPath("a")).toBe("/booking/select-service?bk=eyJsIjoiYSJ9");
  });
});
