import { test, expect } from "@playwright/test";
import { setupAuth, mockApiRoute } from "../fixtures/helpers";
import { mockPremiumStatus } from "../fixtures/mockData";

test.describe("Payment methods", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("renders payment methods page", async ({ page }) => {
    await mockApiRoute(page, "**/premium/status", { ...mockPremiumStatus, tier: "pro" });
    await mockApiRoute(page, /talo\/status/, { connected: false });

    await page.goto("/local/payment-methods");
    await expect(page.getByRole("heading", { name: "Metodos de cobro" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Mercado Pago")).toBeVisible();
    await expect(page.getByText("Reserva parcial")).toBeVisible();
    await expect(page.getByText("Efectivo en el local")).toBeVisible();
  });

  test("shows locked overlay for cash on basic tier", async ({ page }) => {
    await mockApiRoute(page, "**/premium/status", { ...mockPremiumStatus, tier: "basic" });
    await mockApiRoute(page, /talo\/status/, { connected: false });

    await page.goto("/local/payment-methods");
    await expect(page.getByRole("heading", { name: "Metodos de cobro" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/pro/i).first()).toBeVisible();
  });

  test("configures reservation percentage", async ({ page }) => {
    await mockApiRoute(page, "**/premium/status", { ...mockPremiumStatus, tier: "pro" });
    await mockApiRoute(page, /talo\/status/, { connected: false });
    await page.route(/app-api\.sabturno\.com\/local\//, async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      }
    });

    await page.goto("/local/payment-methods");
    await expect(page.getByRole("heading", { name: "Metodos de cobro" })).toBeVisible({ timeout: 10000 });

    // Toggle reservation
    await page.getByText("Reserva parcial").click();
    const percentageInput = page.locator("#reservation-percentage");
    await expect(percentageInput).toBeVisible();
    await percentageInput.fill("20");

    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Cambios guardados exitosamente")).toBeVisible({ timeout: 5000 });
  });
});
