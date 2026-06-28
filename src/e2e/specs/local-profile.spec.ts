import { test, expect } from "@playwright/test";
import { setupAuth, mockApiRoute } from "../fixtures/helpers";
import { mockLocalProfile, mockUser, mockToken } from "../fixtures/mockData";

test.describe("Local profile", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("loads and displays local data", async ({ page }) => {
    await page.route("**/local/available", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [mockLocalProfile] }) });
    });

    await page.goto("/local/profile");
    await expect(page.getByRole("heading", { name: "Perfil del local" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("Nombre de tu negocio")).toHaveValue("Test Local");
    await expect(page.getByPlaceholder("email@ejemplo.com")).toHaveValue("local@test.com");
  });

  test("edits and saves profile changes", async ({ page }) => {
    // Register catch-all FIRST (handles PATCH)
    await page.route("**/*", async (route) => {
      const method = route.request().method();
      if (method === "PATCH") {
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      } else {
        await route.continue();
      }
    });
    // Re-register auth mock (overrides catch-all for auth routes)
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: mockUser, token: mockToken }) });
    });
    // Register local/available mock (overrides catch-all)
    await page.route("**/local/available", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [mockLocalProfile] }) });
    });

    await page.goto("/local/profile");
    await expect(page.getByPlaceholder("Nombre de tu negocio")).toHaveValue("Test Local", { timeout: 10000 });

    await page.getByPlaceholder("Nombre de tu negocio").fill("Nuevo Nombre");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Cambios guardados exitosamente")).toBeVisible({ timeout: 5000 });
  });

  test("shows error on save failure", async ({ page }) => {
    await page.route("**/*", async (route) => {
      const method = route.request().method();
      if (method === "PATCH") {
        await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Error del servidor" }) });
      } else {
        await route.continue();
      }
    });
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: mockUser, token: mockToken }) });
    });
    await page.route("**/local/available", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [mockLocalProfile] }) });
    });

    await page.goto("/local/profile");
    await expect(page.getByPlaceholder("Nombre de tu negocio")).toHaveValue("Test Local", { timeout: 10000 });

    await page.getByPlaceholder("Nombre de tu negocio").fill("Nuevo Nombre");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Request failed with status code 500")).toBeVisible({ timeout: 5000 });
  });
});
