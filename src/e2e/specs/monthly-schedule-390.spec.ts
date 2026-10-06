import { test, expect } from "@playwright/test";
import { setupAuth } from "../fixtures/helpers";

/**
 * Auditoría mobile de `/local/schedules/monthly` a 390px.
 *
 * Sesión y API se mockean (route-level) para poder medir la pantalla real sin
 * depender de un local de prueba. La medición es la del procedure de la skill
 * `mobile-viewport-audit`: `documentElement.scrollWidth === clientWidth` y
 * ningún descendiente de la pantalla con `right > 392`.
 *
 * La medición se ancla en `[data-testid="monthly-schedule"]` y no en `main`: el
 * layout `(local)` sólo envuelve a los hijos en `<main>` mientras carga, así que
 * una consulta sobre `main` en la página hidratada no matchea nada y la
 * comprobación de desborde pasa sin haber medido nada.
 *
 * Se navega directo a la ruta (no con un iframe sobre `setContent`): dentro de
 * un iframe creado después del load el bootstrap de Next y el overlay de dev
 * se pelean con React y aparece
 * `Failed to execute 'removeChild' on 'Node'`, que es ruido del harness y no
 * de la pantalla.
 */
test.describe("local schedules monthly - 390px audit", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no desborda a 390px y guarda el mes completo", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await setupAuth(page);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    await page.route(`${apiBase}/locals/${"*"}/employees`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "emp-1", name: "Ana", isActive: true },
          { id: "emp-2", name: "Bruno", isActive: true },
        ]),
      }),
    );

    const saveCalls: { url: string; body: any }[] = [];
    await page.route(/\/monthly-schedule/, (route) => {
      if (route.request().method() === "PUT") {
        saveCalls.push({
          url: route.request().url(),
          body: route.request().postDataJSON(),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/local/schedules/monthly");
    await expect(page.getByRole("heading", { name: "Horario por mes" })).toBeVisible();

    // El calendario sólo se dibuja después del montaje: se espera a que exista.
    await expect(page.locator(".rbc-month-view")).toBeVisible({ timeout: 15000 });

    const metrics = await page.evaluate(() => {
      const overflowing = Array.from(document.querySelectorAll('[data-testid="monthly-schedule"] *'))
        .filter((el) => el.getBoundingClientRect().right > 392)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 70),
          right: Math.round(el.getBoundingClientRect().right),
        }));
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        overflowing,
      };
    });

    console.log(
      `AUDIT scrollWidth=${metrics.scrollWidth} clientWidth=${metrics.clientWidth} overflowing=${metrics.overflowing.length}`,
    );
    if (metrics.overflowing.length) console.log(JSON.stringify(metrics.overflowing, null, 1));

    expect(metrics.scrollWidth).toBe(390);
    expect(metrics.clientWidth).toBe(390);
    expect(metrics.overflowing).toEqual([]);

    // Flujo real: abrir un día por su número, poner una franja y guardar el mes.
    // Las celdas de día son <button class="rbc-button-link"> con el número solo.
    await page.locator(".rbc-button-link").filter({ hasText: /^15$/ }).click();
    await expect(page.getByRole("button", { name: "Abierto" })).toBeVisible();
    await page.getByRole("button", { name: "Abierto" }).click();
    await expect(page.getByLabel("Hasta (franja 1)")).toBeVisible();

    // El editor del día es un modal: mientras esté abierto, su overlay tapa el
    // botón "Guardar horario del mes" (Playwright fallaría con "element
    // intercepts pointer events"). Se cierra con la X del modal y recién
    // después se guarda.
    await page.getByRole("button", { name: "Cerrar editor del día" }).click();
    await expect(page.getByRole("button", { name: "Abierto" })).toBeHidden();

    await page.getByRole("button", { name: /Guardar horario del mes/ }).click();
    await page.getByRole("button", { name: "Guardar horario" }).click();

    await expect
      .poll(() => saveCalls.length, { timeout: 10000 })
      .toBe(1);

    const payload = saveCalls[0].body;
    // El año y el mes viajan en el path (`/monthly-schedule/:year/:month`), no en el body.
    const segments = new URL(saveCalls[0].url).pathname.split("/");
    const year = Number(segments[segments.length - 2]);
    const month = Number(segments[segments.length - 1]);
    const expectedDays = new Date(year, month, 0).getDate();
    console.log(
      `AUDIT path=${year}-${month} days=${payload.days.length} expected=${expectedDays} employeeId=${String(payload.employeeId)}`,
    );
    expect(month).toBe(new Date().getMonth() + 1);
    expect(year).toBe(new Date().getFullYear());
    expect(payload.employeeId).toBeNull();

    // El mes se manda completo: cada día explícito, cerrado con slots vacíos.
    expect(payload.days).toHaveLength(expectedDays);
    const closed = payload.days.filter((day) => day.isClosed);
    expect(closed.length).toBe(expectedDays - 1);
    closed.forEach((day) => expect(day.slots).toEqual([]));

    expect(pageErrors).toEqual([]);
  });
});