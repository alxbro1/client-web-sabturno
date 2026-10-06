import { test, expect, type Page } from "@playwright/test";
import { setupAuth } from "../fixtures/helpers";

/**
 * Tap táctil en el calendario mensual (monthly schedule).
 *
 * Bug: react-big-calendar v1.20.0 (Selection.js) no emite `onSelectSlot` para
 * tap cortos en touch — el motor de selección solo arranca con long-press de
 * 250 ms. En desktop el click funciona; en móvil tocar el ESPACIO de la celda
 * (cualquier punto que no sea el número del día) no hace nada.
 *
 * El número del día (.rbc-button-link) sí funciona en monthly vía onDrillDown
 * (botón nativo + click sintetizado por el navegador), por eso este test toca
 * deliberadamente la esquina inferior izquierda de la celda: el punto queda
 * lejos del botón, dentro del área que la UI promete ("o el espacio de la
 * celda").
 *
 * La pantalla está en español: monthly promete editar tocando la celda.
 */

/** Toca el ESPACIO de la celda del día buscado (lejos del número del día). */
async function tapDayBackground(page: Page, dayNumber: number) {
  const rows = page.locator(".rbc-month-row");
  const rowCount = await rows.count();
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const links = row.locator(".rbc-button-link");
    const linkCount = await links.count();
    for (let j = 0; j < linkCount; j++) {
      const text = (await links.nth(j).textContent())?.trim() ?? "";
      if (text === String(dayNumber)) {
        // Las .rbc-day-bg (fondo) y las .rbc-button-link (número) se alinean
        // por columna de semana dentro de la misma fila de mes.
        const box = (await row.locator(".rbc-day-bg").nth(j).boundingBox())!;
        await page.touchscreen.tap(box.x + 8, box.y + box.height - 24);
        return;
      }
    }
  }
  throw new Error(`Día ${dayNumber} no encontrado en el mes visible`);
}

test.describe("monthly schedule - tap táctil en celda", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("tocar el espacio de un día abre el editor del día", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await setupAuth(page);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    await page.route(`${apiBase}/locals/*/employees`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: "emp-1", name: "Ana", isActive: true }]),
      }),
    );
    await page.route(/\/monthly-schedule/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      }),
    );

    await page.goto("/local/schedules/monthly");
    await expect(page.locator(".rbc-month-view")).toBeVisible({ timeout: 15000 });

    // El día 15 existe siempre en el mes visible (mismo día que usa el test desktop).
    await tapDayBackground(page, 15);

    // El editor del día se abre — mismo flujo que el click desktop sobre `.rbc-button-link`.
    await expect(page.getByRole("button", { name: "Abierto" })).toBeVisible({ timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });
});