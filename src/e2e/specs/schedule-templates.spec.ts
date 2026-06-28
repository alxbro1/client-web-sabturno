import { test, expect } from "@playwright/test";
import { setupAuth } from "../fixtures/helpers";
import { mockScheduleTemplate } from "../fixtures/mockData";

test.describe("Schedule templates CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("shows empty state when no templates", async ({ page }) => {
    await page.route(/time-stock-template/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto("/local/schedules");
    await expect(page.getByText("No hay plantillas")).toBeVisible({ timeout: 10000 });
  });

  test("creates a new template", async ({ page }) => {
    await page.route(/time-stock-template/, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "new-template" }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }
    });

    await page.goto("/local/schedules/edit/new");
    await page.getByPlaceholder("Ej: Horario regular de verano").fill("Horario verano");
    await page.getByRole("button", { name: "Guardar plantilla" }).click();
    await expect(page).toHaveURL(/\/local\/schedules/, { timeout: 10000 });
  });

  test("edits existing template", async ({ page }) => {
    await page.route(/time-stock-template/, async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === "GET" && url.includes("/template/")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockScheduleTemplate) });
      } else if (method === "PUT") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "template-1" }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }
    });

    await page.goto("/local/schedules/edit/template-1");
    await expect(page.getByPlaceholder("Ej: Horario regular de verano")).toHaveValue("Horario regular", { timeout: 10000 });
    await page.getByPlaceholder("Ej: Horario regular de verano").fill("Horario actualizado");
    await page.getByRole("button", { name: "Guardar plantilla" }).click();
    await expect(page).toHaveURL(/\/local\/schedules/, { timeout: 10000 });
  });

  test("validates that at least one day is active", async ({ page }) => {
    await page.route(/time-stock-template/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto("/local/schedules/edit/new");
    await page.getByPlaceholder("Ej: Horario regular de verano").fill("Test plantilla");

    // Toggle all days off
    const switches = page.locator('button[role="switch"]');
    const count = await switches.count();
    for (let i = 0; i < count; i++) {
      const state = await switches.nth(i).getAttribute("data-state");
      if (state === "checked") {
        await switches.nth(i).click();
      }
    }

    await page.getByRole("button", { name: "Guardar plantilla" }).click();
    await expect(page.getByText("Selecciona al menos un dia activo")).toBeVisible();
  });
});
