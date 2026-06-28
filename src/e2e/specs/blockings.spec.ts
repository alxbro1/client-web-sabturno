import { test, expect } from "@playwright/test";
import { setupAuth, mockApiRoute } from "../fixtures/helpers";

test.describe("Calendar blockings", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("renders blocking page with calendar", async ({ page }) => {
    await mockApiRoute(page, /local\/calendar\//, { appointmentCountByDay: [], blockedDates: [], workingDays: [] });
    await mockApiRoute(page, /time_stock/, []);

    await page.goto("/local/blockings");
    await expect(page.getByText("Bloqueos de calendario")).toBeVisible({ timeout: 10000 });
  });

  test("shows active blocks list", async ({ page }) => {
    const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    await mockApiRoute(page, /local\/calendar\//, {
      appointmentCountByDay: [],
      blockedDates: [
        { id: "block-1", startDate: futureDate, endDate: futureDate, type: "full-day", reason: "Feriado", startTime: null, endTime: null },
      ],
      workingDays: [1, 2, 3, 4, 5],
    });
    await mockApiRoute(page, /time_stock/, []);

    await page.goto("/local/blockings");
    await expect(page.getByText("Bloqueos activos (1)")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Desbloquear" }).first()).toBeVisible();
  });

  test("unblocks a date via confirm dialog", async ({ page }) => {
    const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    await mockApiRoute(page, /local\/calendar\//, {
      appointmentCountByDay: [],
      blockedDates: [
        { id: "block-1", startDate: futureDate, endDate: futureDate, type: "full-day", reason: "Feriado", startTime: null, endTime: null },
      ],
      workingDays: [1, 2, 3, 4, 5],
    });

    await page.route(/blocked-dates/, async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      }
    });

    await page.goto("/local/blockings");
    await expect(page.getByRole("button", { name: "Desbloquear" }).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Desbloquear" }).first().click();
    await expect(page.getByText("Desbloquear fecha")).toBeVisible();
  });
});
