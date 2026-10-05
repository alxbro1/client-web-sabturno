import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  monthlyScheduleService,
  monthlyScheduleDayKey,
  buildMonthDayKeys,
  findMonthlyScheduleMonth,
  type MonthlyScheduleTemplate,
} from "@/features/local/services/monthlySchedule.service";

const { mockApiService } = vi.hoisted(() => ({
  mockApiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ apiService: mockApiService }));

const LOCAL_ID = "local-1";
const EMPLOYEE_ID = "emp-1";
const TZ = "America/Argentina/Buenos_Aires";

function makeTemplate(
  overrides: Partial<MonthlyScheduleTemplate> = {},
): MonthlyScheduleTemplate {
  return {
    id: "tpl-1",
    localId: LOCAL_ID,
    employeeId: null,
    year: 2026,
    month: 1,
    isActive: true,
    days: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("monthlyScheduleService.listMonths", () => {
  it("hits the list endpoint of the local without params for the whole-local scope", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await monthlyScheduleService.listMonths(LOCAL_ID);

    expect(mockApiService.get).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/monthly-schedule`,
      undefined,
    );
  });

  it("passes employeeId as a query param for an employee scope", async () => {
    mockApiService.get.mockResolvedValue({ data: [] });

    await monthlyScheduleService.listMonths(LOCAL_ID, EMPLOYEE_ID);

    expect(mockApiService.get).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/monthly-schedule`,
      { params: { employeeId: EMPLOYEE_ID } },
    );
  });

  it("propagates the failure instead of returning [] (so 'not configured' is distinguishable from 'failed')", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockApiService.get.mockRejectedValue(new Error("network"));

    await expect(monthlyScheduleService.listMonths(LOCAL_ID)).rejects.toThrow(
      "network",
    );
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("normalizes each day date into the local calendar key of the local timezone", async () => {
    mockApiService.get.mockResolvedValue({
      data: [
        {
          id: "tpl-1",
          localId: LOCAL_ID,
          employeeId: null,
          year: 2026,
          month: 1,
          isActive: true,
          days: [
            {
              id: "day-1",
              // UTC instant of 2026-01-15 local midnight in TZ
              date: "2026-01-15T03:00:00.000Z",
              isClosed: false,
              slots: [
                { id: "slot-1", startTime: "09:00", endTime: "12:00" },
              ],
            },
          ],
        },
      ],
    });

    const [template] = await monthlyScheduleService.listMonths(
      LOCAL_ID,
      undefined,
      TZ,
    );

    expect(template.days[0].date).toBe("2026-01-15");
    expect(template.days[0].isClosed).toBe(false);
    expect(template.days[0].slots).toEqual([
      { id: "slot-1", startTime: "09:00", endTime: "12:00" },
    ]);
  });
});

describe("monthlyScheduleService.getMonth", () => {
  it("uses the year/month route with numeric path segments", async () => {
    mockApiService.get.mockResolvedValue({
      data: { id: "tpl-1", localId: LOCAL_ID, year: 2026, month: 1, days: [] },
    });

    await monthlyScheduleService.getMonth(LOCAL_ID, 2026, 1);

    expect(mockApiService.get).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/monthly-schedule/2026/1`,
    );
  });

  it("resolves to null on 404 so the caller can tell 'not configured'", async () => {
    mockApiService.get.mockRejectedValue({
      response: { status: 404 },
    });

    await expect(
      monthlyScheduleService.getMonth(LOCAL_ID, 2026, 1),
    ).resolves.toBeNull();
  });

  it("rethrows a 500 instead of swallowing it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockApiService.get.mockRejectedValue({
      response: { status: 500 },
    });

    await expect(
      monthlyScheduleService.getMonth(LOCAL_ID, 2026, 1),
    ).rejects.toBeDefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("monthlyScheduleService.create", () => {
  it("POSTs year, month, employeeId and days to the collection", async () => {
    mockApiService.post.mockResolvedValue({
      data: { id: "tpl-1", localId: LOCAL_ID, year: 2026, month: 1, days: [] },
    });

    const body = {
      year: 2026,
      month: 1,
      employeeId: EMPLOYEE_ID,
      days: [
        { date: "2026-01-15", slots: [{ startTime: "09:00", endTime: "12:00" }] },
      ],
    };

    await monthlyScheduleService.create(LOCAL_ID, body);

    expect(mockApiService.post).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/monthly-schedule`,
      body,
    );
  });

  it("sends employeeId null for a whole-local template", async () => {
    mockApiService.post.mockResolvedValue({
      data: { id: "tpl-1", localId: LOCAL_ID, year: 2026, month: 1, days: [] },
    });

    await monthlyScheduleService.create(LOCAL_ID, {
      year: 2026,
      month: 1,
      employeeId: null,
      days: [],
    });

    expect(mockApiService.post.mock.calls[0][1]).toMatchObject({
      employeeId: null,
    });
  });
});

describe("monthlyScheduleService.replaceMonth", () => {
  it("PUTs only employeeId and days (year and month travel in the path)", async () => {
    mockApiService.put.mockResolvedValue({
      data: { id: "tpl-2", localId: LOCAL_ID, year: 2026, month: 3, days: [] },
    });

    await monthlyScheduleService.replaceMonth(LOCAL_ID, 2026, 3, {
      employeeId: null,
      days: [{ date: "2026-03-02", isClosed: true, slots: [] }],
    });

    expect(mockApiService.put).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/monthly-schedule/2026/3`,
      {
        employeeId: null,
        days: [{ date: "2026-03-02", isClosed: true, slots: [] }],
      },
    );
  });

  it("propagates a rejected validation so the UI can show the backend message", async () => {
    mockApiService.put.mockRejectedValue({
      response: { status: 400, data: { message: "slot 09:00-08:00 must end after it starts" } },
    });

    await expect(
      monthlyScheduleService.replaceMonth(LOCAL_ID, 2026, 3, { days: [] }),
    ).rejects.toBeDefined();
  });
});

describe("monthlyScheduleService.removeMonth", () => {
  it("DELETEs the year/month route and returns the payload", async () => {
    mockApiService.delete.mockResolvedValue({
      data: { deleted: true, year: 2026, month: 3 },
    });

    const result = await monthlyScheduleService.removeMonth(LOCAL_ID, 2026, 3);

    expect(mockApiService.delete).toHaveBeenCalledWith(
      `/locals/${LOCAL_ID}/monthly-schedule/2026/3`,
    );
    expect(result).toEqual({ deleted: true, year: 2026, month: 3 });
  });
});

describe("monthlyScheduleDayKey", () => {
  it("formats the local calendar day of the given timezone", () => {
    expect(monthlyScheduleDayKey("2026-01-15T03:00:00.000Z", TZ)).toBe(
      "2026-01-15",
    );
  });

  it("shifts the day when the timezone is behind the stored instant", () => {
    // 2026-01-15T03:00Z is still 2026-01-14 in UTC-5
    expect(
      monthlyScheduleDayKey("2026-01-15T03:00:00.000Z", "America/New_York"),
    ).toBe("2026-01-14");
  });
});

describe("buildMonthDayKeys", () => {
  it("returns every local calendar day of the month, in order", () => {
    const days = buildMonthDayKeys(2026, 1);
    expect(days).toHaveLength(31);
    expect(days[0]).toBe("2026-01-01");
    expect(days[30]).toBe("2026-01-31");
  });

  it("handles February in a leap year", () => {
    const days = buildMonthDayKeys(2028, 2);
    expect(days).toHaveLength(29);
    expect(days[28]).toBe("2028-02-29");
  });
});

describe("findMonthlyScheduleMonth", () => {
  const templates = [
    makeTemplate({ id: "local-jan", employeeId: null, year: 2026, month: 1 }),
    makeTemplate({
      id: "emp-jan",
      employeeId: EMPLOYEE_ID,
      year: 2026,
      month: 1,
    }),
  ];

  it("matches the whole-local template when no employee scope is given", () => {
    expect(findMonthlyScheduleMonth(templates, 2026, 1)?.id).toBe("local-jan");
  });

  it("matches the employee template when the scope is that employee", () => {
    expect(findMonthlyScheduleMonth(templates, 2026, 1, EMPLOYEE_ID)?.id).toBe(
      "emp-jan",
    );
  });

  it("returns null when the month is not configured for that scope", () => {
    expect(findMonthlyScheduleMonth(templates, 2026, 5, EMPLOYEE_ID)).toBeNull();
  });
});
