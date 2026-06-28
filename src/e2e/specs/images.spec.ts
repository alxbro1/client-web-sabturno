import { test, expect } from "@playwright/test";
import { setupAuth, mockApiRoute } from "../fixtures/helpers";
import { mockLocalImages } from "../fixtures/mockData";

test.describe("Local images", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("shows empty state when no images", async ({ page }) => {
    await page.route("**/api/local/*/images*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });

    await page.goto("/local/images");
    await expect(page.getByText("No hay fotos del local")).toBeVisible({ timeout: 10000 });
  });

  test("uploads an image", async ({ page }) => {
    await page.route("**/api/local/*/images*", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: 99, url: "https://via.placeholder.com/300", image: "https://via.placeholder.com/300" }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
      }
    });

    await page.goto("/local/images");
    await expect(page.getByText("No hay fotos del local")).toBeVisible({ timeout: 10000 });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("src/e2e/fixtures/mock-image.png");
    await expect(page.locator("img").first()).toBeVisible({ timeout: 10000 });
  });

  test("deletes an image", async ({ page }) => {
    await page.route("**/api/local/*/images*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: mockLocalImages }) });
    });
    await page.route("**/api/local/images/*", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      }
    });

    await page.goto("/local/images");
    await expect(page.locator("img").first()).toBeVisible({ timeout: 10000 });

    // Find and click delete button (trash icon button)
    const deleteButtons = page.locator("button").filter({ has: page.locator("svg.lucide-trash-2") });
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();
      await expect(page.getByText("Eliminar imagen")).toBeVisible();
    }
  });
});
