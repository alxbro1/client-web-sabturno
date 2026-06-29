import { test, expect } from "@playwright/test";

test.describe("Auth registration flow", () => {
  test("registers as local and redirects to login", async ({ page }) => {
    await page.route("**/auth/register", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route("**/location/cities_by_state/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: 1, nombre: "CABA" }, { id: 2, nombre: "La Plata" }]),
      });
    });

    await page.goto("/register");
    await page.getByRole("tab", { name: "LOCAL" }).click();
    await page.getByLabel("Nombre del local").fill("Mi Local");
    await page.getByLabel("Correo electronico").fill("nuevo@test.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("Test1234!");
    await page.getByLabel("Confirmar contraseña").fill("Test1234!");
    await page.getByRole("textbox", { name: "Telefono", exact: true }).fill("1112345678");
    await page.getByLabel("Provincia", { exact: true }).selectOption("Buenos Aires");
    await page.getByLabel("Ciudad", { exact: true }).selectOption("CABA");
    await page.getByLabel("Direccion del local").fill("Av. Corrientes 1234");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page).toHaveURL(/\/login\?emailVerificationPending=true/, { timeout: 10000 });
  });

  test("verified page shows success state", async ({ page }) => {
    await page.goto("/verified?success=true");
    await expect(page.getByText("Correo verificado")).toBeVisible();
    await expect(page.getByText("Tu correo ha sido verificado correctamente")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir a iniciar sesion" })).toBeVisible();
  });

  test("verified page shows failure state with resend form", async ({ page }) => {
    await page.goto("/verified?success=false");
    await expect(page.getByText("Error de verificacion")).toBeVisible();
    await expect(page.getByText("No se pudo verificar tu correo")).toBeVisible();
    await expect(page.getByLabel("Correo electronico")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reenviar verificacion" })).toBeVisible();
  });

  test("resend verification sends email", async ({ page }) => {
    await page.route("**/auth/resend-verification", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/verified?success=false");
    await page.getByLabel("Correo electronico").fill("test@example.com");
    await page.getByRole("button", { name: "Reenviar verificacion" }).click();
    await expect(page.getByText("Correo de verificacion reenviado")).toBeVisible();
  });
});
