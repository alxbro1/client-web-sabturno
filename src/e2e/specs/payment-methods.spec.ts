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
    // El source of truth de los flags de payment methods es `useLocalQuery`
    // (no la session de NextAuth). Hay que mockear `GET /local/:id` con
    // `mercadoPagoLiveMode: true` para poder activar Reserva sin disparar
    // el OAuth de MP. El patrón usa el host del API para NO matchear las
    // páginas del front (que también viven bajo `/local/*`).
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    await page.route(`${apiBase}/local/*`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            name: "Test Local",
            slug: "test-local",
            mercadoPagoLiveMode: true,
            payWithTalo: false,
            payWithReservation: false,
            payWithCashInFront: false,
            reservationPercentage: null,
          }),
        });
        return;
      }
      if (route.request().method() === "PATCH") {
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
        return;
      }
      await route.continue();
    });
    await page.route(/premium\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...mockPremiumStatus, tier: "pro" }) });
    });
    await page.route(/talo\/status/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ connected: false }) });
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
