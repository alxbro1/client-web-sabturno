import { test, expect } from "@playwright/test";
import {
  registerLocalViaUI,
  loginViaUI,
  verifyEmailViaBackend,
} from "../fixtures/helpers";
import { cleanupTestLocal } from "../fixtures/dbHelper";

const TEST_EMAIL = `e2e-setup-${Date.now()}@test.sabturno`;
const TEST_PASSWORD = "Test1234!";

test.describe("Full local setup E2E", () => {
  test.afterAll(async () => {
    await cleanupTestLocal(TEST_EMAIL);
  });

  test("completes full setup from registration to profile edit", async ({ page }) => {
    test.setTimeout(120_000);

    // === 1. REGISTRO ===
    await registerLocalViaUI(page, {
      name: "E2E Test Local",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      phone: "1112345678",
      birthDate: "1990-01-15",
      province: "Buenos Aires",
      city: "CABA",
      address: "Av. Corrientes 1234",
    });
    await expect(page).toHaveURL(/\/login\?emailVerificationPending=true/, { timeout: 15000 });

    // === 2. VERIFICACIÓN EMAIL (vía DB) ===
    await verifyEmailViaBackend(page, TEST_EMAIL);

    // === 3. LOGIN ===
    await loginViaUI(page, TEST_EMAIL, TEST_PASSWORD);
    await expect(page).toHaveURL(/\/local\/onboarding/, { timeout: 15000 });

    // === 4. ONBOARDING ===
    // 4a. Logo - skip
    await expect(page).toHaveURL(/\/local\/onboarding\/logo/, { timeout: 10000 });
    await page.getByRole("button", { name: "Saltar por ahora" }).click();

    // 4b. Plan - keep BASIC trial
    await expect(page).toHaveURL(/\/local\/onboarding\/subscription/, { timeout: 10000 });
    await page.getByRole("button", { name: /Mantener BASIC/ }).click();

    // 4c. Horarios - default, click Finalizar
    await expect(page).toHaveURL(/\/local\/onboarding\/hours/, { timeout: 10000 });
    await page.getByRole("button", { name: "Finalizar" }).click();
    await expect(page).toHaveURL(/\/local\/dashboard/, { timeout: 15000 });

    // === 5. SERVICIOS ===
    await page.goto("/local/services");
    const addServiceBtn = page.getByRole("button", { name: /Agregar primer servicio|Nuevo servicio/ });
    await expect(addServiceBtn).toBeVisible({ timeout: 10000 });
    await addServiceBtn.click();
    await expect(page).toHaveURL(/\/local\/services\/edit\/new/);

    await page.getByLabel("Nombre del servicio").fill("Corte de cabello");
    await page.getByLabel("Precio (ARS)").fill("3500");
    await page.getByLabel("Duracion (minutos)").fill("30");
    await page.getByRole("button", { name: "Crear servicio" }).click();
    await expect(page).toHaveURL(/\/local\/services/, { timeout: 10000 });
    await expect(page.getByText("Corte de cabello")).toBeVisible();

    // Crear segundo servicio
    await page.getByRole("button", { name: "Nuevo servicio" }).click();
    await page.getByLabel("Nombre del servicio").fill("Barba");
    await page.getByLabel("Precio (ARS)").fill("2000");
    await page.getByLabel("Duracion (minutos)").fill("20");
    await page.getByRole("button", { name: "Crear servicio" }).click();
    await expect(page).toHaveURL(/\/local\/services/, { timeout: 10000 });

    // === 6. EMPLEADOS ===
    await page.goto("/local/employees");
    const addEmployeeBtn = page.getByRole("button", { name: /Agregar primer empleado|Nuevo empleado/ });
    await expect(addEmployeeBtn).toBeVisible({ timeout: 10000 });
    await addEmployeeBtn.click();
    await expect(page).toHaveURL(/\/local\/employees\/edit\/new/);

    await page.getByLabel("Nombre").fill("Lucía Martínez");
    await page.getByLabel("Correo electronico (opcional)").fill("lucia@test.com");
    await page.getByRole("button", { name: "Crear empleado" }).click();
    await expect(page).toHaveURL(/\/local\/employees/, { timeout: 10000 });
    await expect(page.getByText("Lucía Martínez")).toBeVisible();

    // Crear segundo empleado
    await page.getByRole("button", { name: "Nuevo empleado" }).click();
    await page.getByLabel("Nombre").fill("Carlos Pérez");
    await page.getByRole("button", { name: "Crear empleado" }).click();
    await expect(page).toHaveURL(/\/local\/employees/, { timeout: 10000 });

    // === 7. BLOQUEOS ===
    await page.goto("/local/blockings");
    await expect(page.getByText("Bloqueos de calendario")).toBeVisible({ timeout: 10000 });

    // === 8. FOTOS ===
    await page.goto("/local/images");
    await expect(page.getByText("No hay fotos del local")).toBeVisible({ timeout: 10000 });
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("src/e2e/fixtures/mock-image.png");
    await expect(page.locator("img").first()).toBeVisible({ timeout: 15000 });

    // === 9. MÉTODOS DE COBRO ===
    await page.goto("/local/payment-methods");
    await expect(page.getByText("Metodos de cobro")).toBeVisible({ timeout: 10000 });
    // Toggle efectivo
    await page.getByText("Efectivo en el local").click();
    // Toggle reserva parcial
    await page.getByText("Reserva parcial").click();
    const percentageInput = page.locator("#reservation-percentage");
    await percentageInput.fill("20");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Cambios guardados exitosamente")).toBeVisible({ timeout: 10000 });

    // === 10. PLANES ===
    await page.goto("/local/premium");
    await expect(page.getByText("Planes")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Básico")).toBeVisible();

    // === 11. PERFIL DEL LOCAL ===
    await page.goto("/local/profile");
    await expect(page.getByText("Perfil del local")).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Nombre del local").fill("E2E Local Actualizado");
    await page.getByLabel("Email de contacto").fill("updated@test.com");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Cambios guardados exitosamente")).toBeVisible({ timeout: 10000 });
  });
});
