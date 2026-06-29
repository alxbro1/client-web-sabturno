import { test, expect, type Page } from "@playwright/test";
import { mockUser, mockToken, mockLocal } from "./mockData";
import { getVerificationToken } from "./dbHelper";

const AUTH_STORAGE_KEY = "sabturno-client-auth";

export async function setupAuth(page: Page) {
  await page.context().addCookies([
    { name: "sabturno_session", value: mockToken, domain: "localhost", path: "/" },
  ]);

  await page.addInitScript(() => {
    const authData = {
      state: {
        user: { id: 1, name: "Test User", email: "test@example.com", isLocal: true, image: null, phone: null },
        token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.mock-token",
        hasHydrated: true,
      },
      version: 0,
    };
    localStorage.setItem("sabturno-client-auth", JSON.stringify(authData));
  });

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: mockUser, token: mockToken }) });
  });
}

export async function setupLocalOwner(page: Page) {
  await setupAuth(page);

  await page.route("**/api/local/home", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockLocal) });
  });
}

export async function mockApiRoute(page: Page, urlPattern: string, data: unknown, status = 200) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
  });
}

// === Helpers para E2E real (contra backend Docker) ===

export async function registerLocalViaUI(
  page: Page,
  data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    birthDate: string;
    province: string;
    city: string;
    address: string;
  },
) {
  // Mock cities API for the LocationFields cascade
  await page.route("**/location/cities_by_state/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: 1, nombre: data.city }]),
    });
  });

  await page.goto("/register");
  await page.getByRole("tab", { name: "LOCAL" }).click();
  await page.getByLabel("Nombre del local").fill(data.name);
  await page.getByLabel("Correo electronico").fill(data.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(data.password);
  await page.getByLabel("Confirmar contraseña").fill(data.password);
  await page.getByRole("textbox", { name: "Telefono", exact: true }).fill(data.phone);
  await page.getByLabel("Tu fecha de nacimiento").fill(data.birthDate);
  await page.getByLabel("Provincia", { exact: true }).selectOption(data.province);
  await page.getByLabel("Ciudad", { exact: true }).selectOption(data.city);
  await page.getByLabel("Direccion del local").fill(data.address);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}

export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
}

export async function verifyEmailViaBackend(page: Page, email: string) {
  const token = await getVerificationToken(email);
  if (!token) throw new Error(`No verification token found for ${email}`);
  await page.goto(`http://localhost:3000/auth/verify?token=${token}`);
  await expect(page).toHaveURL(/\/verified\?success=true/);
}
