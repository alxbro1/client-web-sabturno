import { test, expect } from "@playwright/test";
import { mockUser, mockToken } from "../fixtures/mockData";

test.describe("Auth flow", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });

  test("register creates account and redirects", async ({ page }) => {
    await page.route("**/auth/register", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/register");
    await page.getByLabel("Nombre").fill("Test User");
    await page.getByLabel("Telefono").fill("+541112345678");
    await page.getByLabel("Correo electronico").fill("test@example.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("TestPass123!");
    await page.getByLabel("Confirmar contraseña").fill("TestPass123!");
    await page.getByLabel("Pais").selectOption("AR");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page).toHaveURL(/\/login\?emailVerificationPending=true/);
  });

  test("login successful and redirects to dashboard", async ({ page }) => {
    let signInAttempted = false;

    await page.route("**/api/auth/**", async (route, request) => {
      const url = request.url();

      if (url.includes("/api/auth/callback/credentials")) {
        signInAttempted = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ url: "http://localhost:3001/local/dashboard" }),
        });
        return;
      }

      if (url.includes("/api/auth/session") && signInAttempted) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: { ...mockUser, id: String(mockUser.id) },
            accessToken: mockToken,
            expires: new Date(Date.now() + 86400000).toISOString(),
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/login");
    await page.getByLabel("Correo electronico").fill("test@example.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Iniciar sesion" }).click();

    await expect(page).toHaveURL(/\/local\/dashboard/);
  });

  test("redirects authenticated users from /login to /home", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: mockUser,
          accessToken: mockToken,
          expires: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
    });

    await page.goto("/login");
    await expect(page).toHaveURL(/\/local\/dashboard/);
  });
});
