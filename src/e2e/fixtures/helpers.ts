import type { Page } from "@playwright/test";
import { mockUser, mockToken, mockLocal } from "./mockData";

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
