import { describe, expect, it } from "vitest";
import { buildLocalBookingPath, parseBookingQuery } from "@/lib/utils/bookingQuery";

describe("buildLocalBookingPath", () => {
  it("returns a select-service path whose query round-trips to the same localId", () => {
    const localId = "8a9846e4-53c5-4f48-a9b0-0b6d169636d9";

    const path = buildLocalBookingPath(localId);

    const [pathname, query] = path.split("?");
    expect(pathname).toBe("/booking/select-service");
    expect(parseBookingQuery(new URLSearchParams(query)).localId).toBe(localId);
  });

  it.each(["", "   "])("returns the bare path with no query for blank id %j", (blank) => {
    expect(buildLocalBookingPath(blank)).toBe("/booking/select-service");
  });
});
