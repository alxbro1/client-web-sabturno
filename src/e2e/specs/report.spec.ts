import { test, expect } from "@playwright/test";
import { mockUser, mockToken, mockReports } from "../fixtures/mockData";
import { setupAuth } from "../fixtures/helpers";

test.describe("Reports page", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("shows empty state when no reports", async ({ page }) => {
    await page.route("**/reports/my-reports", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto("/reports");
    await expect(page.getByText("No has enviado reportes")).toBeVisible();
  });

  test("displays report list", async ({ page }) => {
    await page.route("**/reports/my-reports", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockReports) });
    });

    await page.goto("/reports");
    await expect(page.getByText("Test Local").first()).toBeVisible();
    await expect(page.getByText("No asistió")).toBeVisible();
    await expect(page.getByText("Mal servicio")).toBeVisible();
  });

  test("shows report status labels", async ({ page }) => {
    await page.route("**/reports/my-reports", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockReports) });
    });

    await page.goto("/reports");
    await expect(page.getByText("Pendiente")).toBeVisible();
    await expect(page.getByText("Resuelto")).toBeVisible();
  });
});
