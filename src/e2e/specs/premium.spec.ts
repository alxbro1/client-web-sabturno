import { test, expect, type Page } from "@playwright/test";
import { setupAuth } from "../fixtures/helpers";
import {
  mockPremiumStatus,
  mockWhatsappWallet,
  mockWhatsappWalletPostpaid,
} from "../fixtures/mockData";

/**
 * `/local/premium` is the WhatsApp credits wallet, not a plan sales page.
 * Every SabTurno feature is free; the only metered resource is the WhatsApp
 * template, billed to the local per message.
 */
async function mockWallet(page: Page, wallet: unknown) {
  await page.route(/whatsapp\/billing\/wallet/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(wallet),
    });
  });
  await page.route(/premium\/status/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...mockPremiumStatus, autoRenew: false }),
    });
  });
}

test.describe("WhatsApp credits wallet", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("shows the welcome balance and the prepaid-only state", async ({
    page,
  }) => {
    await mockWallet(page, mockWhatsappWallet);

    await page.goto("/local/premium");

    await expect(
      page.getByRole("heading", { name: "Créditos y Consumo de WhatsApp" }),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/Incluye tus 5 mensajes de bienvenida gratis/i),
    ).toBeVisible();
    await expect(page.getByText("Modo prepago inicial")).toBeVisible();
  });

  test("no longer sells premium plans", async ({ page }) => {
    await mockWallet(page, mockWhatsappWallet);

    await page.goto("/local/premium");
    await expect(
      page.getByRole("heading", { name: "Créditos y Consumo de WhatsApp" }),
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole("heading", { name: "Básico" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Enterprise" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: "Plan actual" })).toHaveCount(
      0,
    );
  });

  test("prices the packs from the unit price the wallet reports", async ({
    page,
  }) => {
    await mockWallet(page, { ...mockWhatsappWallet, unitPriceArs: 20 });

    await page.goto("/local/premium");
    await expect(
      page.getByRole("heading", { name: "Créditos y Consumo de WhatsApp" }),
    ).toBeVisible({ timeout: 10000 });

    // 150 messages at $20 is $3.000, not the $2.250 a hardcoded $15 would give.
    await expect(page.getByText(/\$\s*3\.000/).first()).toBeVisible();
    await expect(page.getByText(/\$\s*2\.250/)).toHaveCount(0);
  });

  test("rejects a custom amount below the 20-message minimum", async ({
    page,
  }) => {
    await mockWallet(page, mockWhatsappWallet);

    await page.goto("/local/premium");
    const customInput = page.getByLabel(/O ingresá otra cantidad/i);
    await expect(customInput).toBeVisible({ timeout: 10000 });
    await customInput.fill("10");

    await page
      .getByRole("button", { name: /Comprar .* créditos con Mercado Pago/i })
      .click();

    // Scope past Next's own route announcer, which is also role="alert".
    await expect(
      page.getByRole("alert").filter({ hasText: /entre 20 y/i }),
    ).toBeVisible();
  });

  test("offers to settle the accumulated postpaid balance", async ({
    page,
  }) => {
    await mockWallet(page, mockWhatsappWalletPostpaid);

    await page.goto("/local/premium");

    await expect(page.getByText("Habilitado")).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /Pagar consumo acumulado/i }),
    ).toBeVisible();
  });
});
