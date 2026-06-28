import { test, expect } from "@playwright/test";
import { setupAuth, setupLocalOwner, mockApiRoute } from "../fixtures/helpers";
import {
  mockUser,
  mockToken,
  mockLocal,
  mockEmployees,
  mockServices,
  mockReports,
} from "../fixtures/mockData";

test.describe("Seed", () => {
  test("seed", async ({ page }) => {
    // This test is a seed/reference for the Playwright Test Generator.
    // It demonstrates SabTurno's E2E patterns.
    // Use setupAuth() for authenticated tests, setupLocalOwner() for local-owner tests.

    // Example: authenticated test setup
    await setupAuth(page);

    // Example: mock a GET endpoint
    await mockApiRoute(page, "**/api/services", mockServices);

    // Example: mock a POST endpoint with conditional method
    await page.route("**/api/employees", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: 3, name: "Nuevo" }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockEmployees),
        });
      }
    });

    await page.goto("/local/employees");
    await expect(page.getByText("Test User")).toBeVisible();
  });
});
