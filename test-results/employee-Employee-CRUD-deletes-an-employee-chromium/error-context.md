# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: employee.spec.ts >> Employee CRUD >> deletes an employee
- Location: src/e2e/specs/employee.spec.ts:59:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Eliminar', exact: true }) resolved to 3 elements:
    1) <button class="border rounded-2xl px-[1.15rem] py-[0.9rem] cursor-pointer font-semibold transition-[opacity,transform,border-color,background-color,color,box-shadow] duration-[140ms] ease-in-out hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f068]/50 text-white border-[#ff5678]/35 bg-red/85 hover:bg-[#ff5678] rounded-full  px-3 py-2 text-[0.85rem]">Eliminar</button> aka getByRole('button', { name: 'Eliminar' }).first()
    2) <button class="border rounded-2xl px-[1.15rem] py-[0.9rem] cursor-pointer font-semibold transition-[opacity,transform,border-color,background-color,color,box-shadow] duration-[140ms] ease-in-out hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f068]/50 text-white border-[#ff5678]/35 bg-red/85 hover:bg-[#ff5678] rounded-full  px-3 py-2 text-[0.85rem]">Eliminar</button> aka getByRole('button', { name: 'Eliminar' }).nth(1)
    3) <button class="border rounded-2xl px-[1.15rem] py-[0.9rem] cursor-pointer font-semibold transition-[opacity,transform,border-color,background-color,color,box-shadow] duration-[140ms] ease-in-out hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f068]/50 text-white border-[#ff5678]/35 bg-red/85 hover:bg-[#ff5678] rounded-full  flex-1 sm:flex-none">Eliminar</button> aka getByRole('button', { name: 'Eliminar' }).nth(2)

Call log:
  - waiting for getByRole('button', { name: 'Eliminar', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
          - generic [ref=e56]:
            - heading "Empleados" [level=1] [ref=e57]
            - paragraph [ref=e58]: Gestiona los empleados de tu local
          - link "Nuevo empleado" [ref=e59] [cursor=pointer]:
            - /url: /local/employees/edit/new
            - button "Nuevo empleado" [ref=e60]
        - generic [ref=e61]:
          - article [ref=e62]:
            - generic [ref=e63]: A
            - generic [ref=e64]:
              - paragraph [ref=e65]: Ana Gómez
              - generic [ref=e67]: ana@example.com
            - generic [ref=e68]:
              - link "Editar" [ref=e69] [cursor=pointer]:
                - /url: /local/employees/edit/1
                - button "Editar" [ref=e70]
              - button "Eliminar" [active] [ref=e71] [cursor=pointer]
          - article [ref=e72]:
            - generic [ref=e73]: C
            - generic [ref=e74]:
              - paragraph [ref=e75]: Carlos Pérez
              - generic [ref=e77]: carlos@example.com
            - generic [ref=e78]:
              - link "Editar" [ref=e79] [cursor=pointer]:
                - /url: /local/employees/edit/2
                - button "Editar" [ref=e80]
              - button "Eliminar" [ref=e81] [cursor=pointer]
        - generic [ref=e84]:
          - generic [ref=e85]:
            - heading "Eliminar empleado" [level=2] [ref=e86]
            - paragraph [ref=e87]: Esta accion no se puede deshacer. El empleado sera desactivado permanentemente.
          - generic [ref=e88]:
            - button "Cancelar" [ref=e89] [cursor=pointer]
            - button "Eliminar" [ref=e90] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e96] [cursor=pointer]:
    - img [ref=e97]
  - alert [ref=e100]
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
  52 |     await page.waitForSelector('input[value="Ana Gómez"]', { timeout: 10000 });
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
> 64 |     await page.getByRole("button", { name: "Eliminar", exact: true }).click({ force: true });
     |                                                                       ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Eliminar', exact: true }) resolved to 3 elements:
  65 |   });
  66 | });
  67 | 
```