import { test, expect } from "@playwright/test";
import { setupAuth } from "../fixtures/helpers";
import { mockPremiumPlans, mockPremiumStatus } from "../fixtures/mockData";

test.describe("Premium plans", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("displays plan cards", async ({ page }) => {
    await page.route(/premium\/plans/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockPremiumPlans) });
    });
    await page.route(/premium\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockPremiumStatus) });
    });

    await page.goto("/local/premium");
    await expect(page.getByRole("heading", { name: "Básico" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enterprise" })).toBeVisible();
  });

  test("shows current plan badge", async ({ page }) => {
    await page.route(/premium\/plans/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockPremiumPlans) });
    });
    await page.route(/premium\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...mockPremiumStatus, tier: "pro", currentPlanId: "plan-pro" }) });
    });

    await page.goto("/local/premium");
    await expect(page.getByRole("button", { name: "Plan actual" })).toBeVisible({ timeout: 10000 });
  });

  test("manage subscription link visible for non-basic", async ({ page }) => {
    await page.route(/premium\/plans/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockPremiumPlans) });
    });
    await page.route(/premium\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...mockPremiumStatus, tier: "pro" }) });
    });

    await page.goto("/local/premium");
    await expect(page.getByText("Gestionar suscripción")).toBeVisible({ timeout: 10000 });
  });
});
