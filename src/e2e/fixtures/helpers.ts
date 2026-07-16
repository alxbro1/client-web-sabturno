import { test, expect, type Page } from "@playwright/test";
import { mockUser, mockToken, mockLocal } from "./mockData";
import { getVerificationToken } from "./dbHelper";

const AUTH_STORAGE_KEY = "sabturno-client-auth";

/**
 * Local por defecto para tests E2E. Incluye los flags de payment methods
 * que la pantalla `/local/payment-methods` consume vía `useLocalQuery`
 * (ver `src/hooks/queries/useLocalQuery.ts`).
 */
const DEFAULT_LOCAL = {
  ...mockLocal,
  mercadoPagoLiveMode: false,
  payWithTalo: false,
  payWithReservation: false,
  payWithCashInFront: false,
  reservationPercentage: null,
};

export async function setupAuth(page: Page) {
  // NextAuth v5 usa `next-auth.session-token` como cookie. La seteamos
  // para que `useSession()` la reconozca.
  await page.context().addCookies([
    {
      name: "authjs.session-token",
      value: mockToken,
      domain: "localhost",
      path: "/",
    },
  ]);

  // Mock del endpoint `/api/auth/session` (NextAuth v5). Este es el que
  // `useSession()` consume para hidratar la session. Devolvemos un user
  // con `isLocal: true` para que el (local) layout no redirija a /home.
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { ...mockUser, id: String(mockUser.id) },
        accessToken: mockToken,
        expires: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
  });

  // Mock por defecto de `GET /local/:id` (usado por `useLocalQuery`).
  // IMPORTANTE: el patrón debe matchear la URL del API, NO las páginas
  // del front (que también viven bajo `/local/*`). Discriminamos por el
  // host del API (configurado en `NEXT_PUBLIC_API_URL`).
  // Tests que necesiten un local distinto pueden re-mockear esta ruta
  // después de llamar a `setupAuth`.
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  await page.route(`${apiBase}/local/*`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DEFAULT_LOCAL),
      });
      return;
    }
    await route.continue();
  });

  // Mock por defecto del sync de Talo (`GET /talo/partners/account/:id`).
  // Lo llama `usePaymentMethods.refreshTaloStatus()` cuando el status
  // inicial no es `ACTIVE`. Devolvemos un payload "no conectado" para
  // que el hook no entre en loop de reintentos.
  await page.route(`${apiBase}/talo/partners/account/*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ connected: false, accountStatus: null }),
    });
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
