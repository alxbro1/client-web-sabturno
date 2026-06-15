import { test, expect } from "@playwright/test";
import { mockEmployees, mockEmployeeCreated } from "../fixtures/mockData";
import { setupAuth } from "../fixtures/helpers";

async function setupEmployeeListMock(page: import("@playwright/test").Page, data: unknown) {
  await page.route(/app-api\.sabturno\.com\/locals\/\d+\/employees$/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  });
}

test.describe("Employee CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("shows empty state when no employees", async ({ page }) => {
    await page.route(/app-api\.sabturno\.com\/locals\/\d+\/employees$/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto("/local/employees");
    await expect(page.getByText("No hay empleados registrados")).toBeVisible();
  });

  test("creates a new employee", async ({ page }) => {
    await page.route(/app-api\.sabturno\.com\/locals\/\d+\/employees/, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(mockEmployeeCreated) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }
    });

    await page.goto("/local/employees/edit/new");
    await page.getByLabel("Nombre").fill("Nuevo Empleado");
    await page.getByLabel("Correo electronico (opcional)").fill("nuevo@example.com");
    await page.getByRole("button", { name: "Crear empleado" }).click();
    await expect(page).toHaveURL(/\/local\/employees/);
  });

  test("edits an existing employee", async ({ page }) => {
    await setupEmployeeListMock(page, mockEmployees);
    await page.goto("/local/employees/edit/1");
    await expect(page.getByText("Ana Gómez")).toBeVisible({ timeout: 15000 });
    await page.getByLabel("Nombre").fill("Ana Martínez");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL(/\/local\/employees/);
  });

  test("deletes an employee", async ({ page }) => {
    await setupEmployeeListMock(page, mockEmployees);
    await page.goto("/local/employees");
    await expect(page.getByText("Ana Gómez")).toBeVisible();
    await page.getByRole("button", { name: "Eliminar" }).first().click();
    await page.getByRole("button", { name: "Eliminar" }).nth(2).click({ force: true });
  });
});
