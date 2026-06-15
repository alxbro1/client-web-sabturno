import { test, expect } from "@playwright/test";
import { mockUser, mockToken } from "../fixtures/mockData";

test.describe("Auth flow", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?from=%2Fhome/);
  });

  test("register creates account and redirects", async ({ page }) => {
    await page.route("**/auth/register", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/register");
    await page.getByLabel("Nombre").fill("Test User");
    await page.getByLabel("Telefono").fill("+541112345678");
    await page.getByLabel("Correo electronico").fill("test@example.com");
    await page.getByLabel("Contrasena", { exact: true }).fill("TestPass123!");
    await page.getByLabel("Confirmar Contrasena").fill("TestPass123!");
    await page.getByLabel("Fecha de nacimiento").fill("1990-01-15");
    await page.getByLabel("Pais").selectOption("AR");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page).toHaveURL(/\/login\?emailVerificationPending=true/);
  });

  test("login successful and redirects to dashboard", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          "Set-Cookie": "sabturno_session=mock-token; Path=/; HttpOnly; SameSite=Lax",
        },
        contentType: "application/json",
        body: JSON.stringify({ user: mockUser, token: mockToken }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Correo electronico").fill("test@example.com");
    await page.getByLabel("Contrasena").fill("password123");
    await page.getByRole("button", { name: "Iniciar sesion" }).click();

    await expect(page).toHaveURL(/\/local\/dashboard/);
  });

  test("redirects authenticated users from /login to /home", async ({ page }) => {
    await page.context().addCookies([
      { name: "sabturno_session", value: mockToken, domain: "localhost", path: "/" },
    ]);
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: mockUser, token: mockToken }) });
    });

    await page.goto("/login");
    await expect(page).toHaveURL(/\/home/);
  });
});
