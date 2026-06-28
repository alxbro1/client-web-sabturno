import { test, expect } from "@playwright/test";
import { setupAuth } from "../fixtures/helpers";
import { mockPremiumStatus, mockUser, mockToken } from "../fixtures/mockData";

test.describe("Payment methods", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("renders payment methods page", async ({ page }) => {
    await page.route(/premium\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...mockPremiumStatus, tier: "pro" }) });
    });
    await page.route(/talo\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ connected: false }) });
    });

    await page.goto("/local/payment-methods");
    await expect(page.getByRole("heading", { name: "Metodos de cobro" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Reserva parcial" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Efectivo en el local" })).toBeVisible();
  });

  test("shows locked overlay for cash on basic tier", async ({ page }) => {
    await page.route(/premium\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...mockPremiumStatus, tier: "basic" }) });
    });
    await page.route(/talo\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ connected: false }) });
    });

    await page.goto("/local/payment-methods");
    await expect(page.getByRole("heading", { name: "Metodos de cobro" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/pro/i).first()).toBeVisible();
  });

  test("configures reservation percentage", async ({ page }) => {
    // Mock user with mercadoPagoLiveMode enabled (required to activate reservation without OAuth redirect)
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: { ...mockUser, mercadoPagoLiveMode: true }, token: mockToken }),
      });
    });
    await page.route(/premium\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...mockPremiumStatus, tier: "pro" }) });
    });
    await page.route(/talo\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ connected: false }) });
    });
    // Mock PATCH to /local/{id} for saving
    await page.route("**/local/*", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      } else {
        await route.continue();
      }
    });

    await page.goto("/local/payment-methods");
    await expect(page.getByRole("heading", { name: "Metodos de cobro" })).toBeVisible({ timeout: 10000 });

    // Toggle reservation
    await page.getByRole("button", { name: "Reserva parcial" }).click();
    const percentageInput = page.locator("#reservation-percentage");
    await expect(percentageInput).toBeVisible({ timeout: 5000 });
    await percentageInput.fill("20");

    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Cambios guardados exitosamente")).toBeVisible({ timeout: 5000 });
  });
});
