import { test, expect } from "@playwright/test";
import { setupLocalOwner, mockApiRoute } from "../fixtures/helpers";
import { mockPremiumStatus } from "../fixtures/mockData";

test.describe("Onboarding wizard", () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalOwner(page);
  });

  test("completes full onboarding: skip logo, keep plan, set hours", async ({ page }) => {
    // Mock premium status with no plan (triggers onboarding)
    await mockApiRoute(page, "**/premium/status", { ...mockPremiumStatus, currentPlanId: null });
    // Mock empty templates (no schedule yet)
    await page.route(/time-stock-template/, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "new-template" }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }
    });

    await page.goto("/local/onboarding");

    // Step 1: Logo - skip
    await expect(page).toHaveURL(/\/local\/onboarding\/logo/, { timeout: 10000 });
    await page.getByRole("button", { name: "Saltar por ahora" }).click();

    // Step 2: Credits info step - continue
    await expect(page).toHaveURL(/\/local\/onboarding\/subscription/, { timeout: 10000 });
    await page.getByRole("button", { name: "Continuar" }).click();

    // Step 3: Hours - default Mon-Fri 09-18
    await expect(page).toHaveURL(/\/local\/onboarding\/hours/, { timeout: 10000 });
    await page.getByRole("button", { name: "Finalizar" }).click();

    await expect(page).toHaveURL(/\/local\/dashboard/, { timeout: 15000 });
  });

  test("subscription step shows the credits info and no plans", async ({ page }) => {
    await mockApiRoute(page, "**/premium/status", mockPremiumStatus);

    await page.goto("/local/onboarding/subscription");
    await expect(page.getByText("Todo SabTurno es gratis")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("5 créditos de bienvenida")).toBeVisible();
    await expect(page.getByText("$15 por mensaje")).toBeVisible();
    await expect(page.getByRole("link", { name: /Ver mi billetera/ })).toHaveAttribute(
      "href",
      "/local/premium",
    );
    await expect(page.getByText("Enterprise")).toHaveCount(0);
  });

  test("hours step validates time ranges", async ({ page }) => {
    await mockApiRoute(page, "**/premium/status", mockPremiumStatus);
    await mockApiRoute(page, /time-stock-template/, []);

    await page.goto("/local/onboarding/hours");

    // Find the Monday row and its close input
    // The onboarding hours page uses InputField with label "Cierre"
    const cierreInputs = page.getByLabel("Cierre");
    // First Cierre input belongs to Monday (Lunes is the first day)
    await cierreInputs.first().fill("08:00");

    await page.getByRole("button", { name: "Finalizar" }).click();
    await expect(page.getByText(/hora de cierre/)).toBeVisible();
  });
});
