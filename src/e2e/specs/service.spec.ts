import { test, expect } from "@playwright/test";
import { mockServices, mockServiceCreated } from "../fixtures/mockData";
import { setupAuth } from "../fixtures/helpers";

test.describe("Service CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("shows empty state when no services", async ({ page }) => {
    await page.route("https://app-api.sabturno.com/service/bylocal/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto("/local/services");
    await expect(page.getByText("No hay servicios registrados")).toBeVisible();
  });

  test("creates a new service", async ({ page }) => {
    await page.route("https://app-api.sabturno.com/service", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(mockServiceCreated) });
      }
    });

    await page.goto("/local/services/edit/new");
    await page.getByLabel("Nombre del servicio").fill("Nuevo Servicio");
    await page.getByLabel("Descripcion (opcional)").fill("Descripción del servicio");
    await page.getByLabel("Precio (ARS)").fill("4000");
    await page.getByLabel("Duracion (minutos)").fill("60");
    await page.getByRole("button", { name: "Crear servicio" }).click();
    await expect(page).toHaveURL(/\/local\/services/);
  });

  test("edits an existing service", async ({ page }) => {
    await page.route("https://app-api.sabturno.com/service/bylocal/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockServices) });
    });

    await page.goto("/local/services/edit/1");
    await page.waitForSelector('input[value="Corte de cabello"]', { timeout: 10000 });
    await page.getByLabel("Nombre del servicio").fill("Corte moderno");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL(/\/local\/services/);
  });

  test("deletes a service", async ({ page }) => {
    await page.route("https://app-api.sabturno.com/service/bylocal/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockServices) });
    });

    await page.goto("/local/services");
    await page.getByRole("button", { name: "Eliminar" }).first().click();
    await page.getByRole("button", { name: "Eliminar", exact: true }).click({ force: true });
  });
});
