# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: employee.spec.ts >> Employee CRUD >> edits an existing employee
- Location: src/e2e/specs/employee.spec.ts:48:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[value="Ana Gómez"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - link "SabTurno" [ref=e5] [cursor=pointer]:
          - /url: /local/dashboard
          - img "SabTurno" [ref=e6]
        - paragraph [ref=e7]: Panel de administracion del local
      - navigation [ref=e8]:
        - link "Panel" [ref=e9] [cursor=pointer]:
          - /url: /local/dashboard
          - img [ref=e10]
          - generic [ref=e12]: Panel
        - link "Turnos" [ref=e13] [cursor=pointer]:
          - /url: /local/calendar
          - img [ref=e14]
          - generic [ref=e16]: Turnos
        - link "Horarios" [ref=e17] [cursor=pointer]:
          - /url: /local/schedules
          - img [ref=e18]
          - generic [ref=e20]: Horarios
        - link "Empleados" [ref=e21] [cursor=pointer]:
          - /url: /local/employees
          - img [ref=e22]
          - generic [ref=e24]: Empleados
        - link "Servicios" [ref=e25] [cursor=pointer]:
          - /url: /local/services
          - img [ref=e26]
          - generic [ref=e28]: Servicios
        - link "Bloqueos" [ref=e29] [cursor=pointer]:
          - /url: /local/blockings
          - img [ref=e30]
          - generic [ref=e32]: Bloqueos
        - link "Fotos" [ref=e33] [cursor=pointer]:
          - /url: /local/images
          - img [ref=e34]
          - generic [ref=e36]: Fotos
        - link "Metodos de cobro" [ref=e37] [cursor=pointer]:
          - /url: /local/payment-methods
          - img [ref=e38]
          - generic [ref=e40]: Metodos de cobro
        - link "Perfil" [ref=e41] [cursor=pointer]:
          - /url: /local/profile
          - img [ref=e42]
          - generic [ref=e44]: Perfil
      - generic [ref=e45]:
        - generic [ref=e46]:
          - paragraph [ref=e47]: Local
          - strong [ref=e48]: Test User
        - button "Cerrar sesion" [ref=e49] [cursor=pointer]:
          - img [ref=e50]
          - generic [ref=e52]: Cerrar sesion
    - main [ref=e53]:
      - generic [ref=e54]:
        - generic [ref=e55]:
          - link [ref=e56] [cursor=pointer]:
            - /url: /local/employees
            - img [ref=e57]
          - generic [ref=e59]:
            - heading "Editar empleado" [level=1] [ref=e60]
            - paragraph [ref=e61]: Modifica los datos del empleado
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e64]: Nombre
            - textbox "Nombre" [ref=e66]
          - generic [ref=e67]:
            - generic [ref=e68]: Correo electronico (opcional)
            - textbox "Correo electronico (opcional)" [ref=e70]
          - generic [ref=e71]:
            - generic [ref=e72]: Telefono (opcional)
            - textbox "Telefono (opcional)" [ref=e74]
          - generic [ref=e75]:
            - generic [ref=e76]: Color
            - generic [ref=e77]:
              - button [ref=e78]
              - button [ref=e79]
              - button [ref=e80]
              - button [ref=e81]
              - button [ref=e82]
              - button [ref=e83]
              - button [ref=e84]
              - button [ref=e85]
          - generic [ref=e86]:
            - link "Cancelar" [ref=e87] [cursor=pointer]:
              - /url: /local/employees
              - button "Cancelar" [ref=e88]
            - button "Guardar cambios" [disabled] [ref=e89]
  - button "Open Next.js Dev Tools" [ref=e95] [cursor=pointer]:
    - img [ref=e96]
  - alert [ref=e99]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { mockEmployees, mockEmployeeCreated } from "../fixtures/mockData";
  3  | import { setupAuth } from "../fixtures/helpers";
  4  | 
  5  | function setupListMock(page: import("@playwright/test").Page, data: unknown) {
  6  |   return page.route("https://app-api.sabturno.com/locals/*/employees", async (route) => {
  7  |     await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  8  |   });
  9  | }
  10 | 
  11 | function setupSingleMock(page: import("@playwright/test").Page, method: string, data?: unknown) {
  12 |   return page.route("https://app-api.sabturno.com/locals/*/employees/*", async (route) => {
  13 |     if (route.request().method() === method) {
  14 |       await route.fulfill({ status: data ? 200 : 204, contentType: "application/json", body: data ? JSON.stringify(data) : undefined });
  15 |     } else {
  16 |       await route.continue();
  17 |     }
  18 |   });
  19 | }
  20 | 
  21 | test.describe("Employee CRUD", () => {
  22 |   test.beforeEach(async ({ page }) => {
  23 |     await setupAuth(page);
  24 |   });
  25 | 
  26 |   test("shows empty state when no employees", async ({ page }) => {
  27 |     await setupListMock(page, []);
  28 |     await page.goto("/local/employees");
  29 |     await expect(page.getByText("No hay empleados registrados")).toBeVisible();
  30 |   });
  31 | 
  32 |   test("creates a new employee", async ({ page }) => {
  33 |     await page.route("https://app-api.sabturno.com/locals/*/employees", async (route) => {
  34 |       if (route.request().method() === "POST") {
  35 |         await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(mockEmployeeCreated) });
  36 |       } else {
  37 |         await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  38 |       }
  39 |     });
  40 | 
  41 |     await page.goto("/local/employees/edit/new");
  42 |     await page.getByLabel("Nombre").fill("Nuevo Empleado");
  43 |     await page.getByLabel("Correo electronico (opcional)").fill("nuevo@example.com");
  44 |     await page.getByRole("button", { name: "Crear empleado" }).click();
  45 |     await expect(page).toHaveURL(/\/local\/employees/);
  46 |   });
  47 | 
  48 |   test("edits an existing employee", async ({ page }) => {
  49 |     await setupListMock(page, mockEmployees);
  50 | 
  51 |     await page.goto("/local/employees/edit/1");
> 52 |     await page.waitForSelector('input[value="Ana Gómez"]', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  53 |     await page.getByLabel("Nombre").fill("Ana Martínez");
  54 |     await setupSingleMock(page, "PATCH");
  55 |     await page.getByRole("button", { name: "Guardar cambios" }).click();
  56 |     await expect(page).toHaveURL(/\/local\/employees/);
  57 |   });
  58 | 
  59 |   test("deletes an employee", async ({ page }) => {
  60 |     await setupListMock(page, mockEmployees);
  61 | 
  62 |     await page.goto("/local/employees");
  63 |     await page.getByRole("button", { name: "Eliminar" }).first().click();
  64 |     await page.getByRole("button", { name: "Eliminar", exact: true }).click({ force: true });
  65 |   });
  66 | });
  67 | 
```