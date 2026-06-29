import { test, expect } from "@playwright/test";

test.describe("Password reset flow", () => {
  test("forgot password sends email successfully", async ({ page }) => {
    await page.route("**/auth/forgot-password", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/forgot-password");
    await page.getByLabel("Correo electronico").fill("test@example.com");
    await page.getByRole("button", { name: "Enviar enlace" }).click();

    await expect(page.getByText("Te enviamos un enlace")).toBeVisible();
  });

  test("shows error when no token provided", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("Enlace invalido")).toBeVisible();
    await expect(page.getByText("El enlace de restablecimiento no es valido o ha expirado")).toBeVisible();
  });

  test("reset password successful with valid token", async ({ page }) => {
    await page.route("**/auth/reset-password", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/reset-password?token=valid-token");
    await page.getByLabel("Nueva contraseña").fill("NewPass123!");
    await page.getByLabel("Confirmar contraseña").fill("NewPass123!");
    await page.getByRole("button", { name: "Restablecer contraseña" }).click();

    await expect(page.getByText("Contraseña restablecida")).toBeVisible();
    await expect(page.getByText("Tu contraseña fue actualizada correctamente")).toBeVisible();
  });
});
