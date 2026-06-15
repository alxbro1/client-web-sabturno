# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: service.spec.ts >> Service CRUD >> deletes a service
- Location: src/e2e/specs/service.spec.ts:47:3

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
            - heading "Servicios" [level=1] [ref=e57]
            - paragraph [ref=e58]: Gestiona los servicios de tu local
          - link "Nuevo servicio" [ref=e59] [cursor=pointer]:
            - /url: /local/services/edit/new
            - button "Nuevo servicio" [ref=e60]
        - generic [ref=e61]:
          - article [ref=e62]:
            - generic [ref=e63]:
              - generic [ref=e64]:
                - paragraph [ref=e65]: Corte de cabello
                - generic [ref=e66]: Inactivo
              - paragraph [ref=e67]: Corte clásico
              - generic [ref=e68]:
                - generic [ref=e69]: $ 5.000,00
                - generic [ref=e70]: 30 min
                - generic [ref=e71]: PELUQUERIA
            - generic [ref=e72]:
              - link "Editar" [ref=e73] [cursor=pointer]:
                - /url: /local/services/edit/1
                - button "Editar" [ref=e74]
              - button "Eliminar" [active] [ref=e75] [cursor=pointer]
          - article [ref=e76]:
            - generic [ref=e77]:
              - generic [ref=e78]:
                - paragraph [ref=e79]: Manicuría
                - generic [ref=e80]: Inactivo
              - paragraph [ref=e81]: Manicuría completa
              - generic [ref=e82]:
                - generic [ref=e83]: $ 3.500,00
                - generic [ref=e84]: 45 min
                - generic [ref=e85]: MANICURIA
            - generic [ref=e86]:
              - link "Editar" [ref=e87] [cursor=pointer]:
                - /url: /local/services/edit/2
                - button "Editar" [ref=e88]
              - button "Eliminar" [ref=e89] [cursor=pointer]
        - generic [ref=e92]:
          - generic [ref=e93]:
            - heading "Eliminar servicio" [level=2] [ref=e94]
            - paragraph [ref=e95]: Si el servicio tiene turnos asociados, sera desactivado en lugar de eliminado. De lo contrario, se eliminara permanentemente.
          - generic [ref=e96]:
            - button "Cancelar" [ref=e97] [cursor=pointer]
            - button "Eliminar" [ref=e98] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e104] [cursor=pointer]:
    - img [ref=e105]
  - alert [ref=e108]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { mockServices, mockServiceCreated } from "../fixtures/mockData";
  3  | import { setupAuth } from "../fixtures/helpers";
  4  | 
  5  | test.describe("Service CRUD", () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await setupAuth(page);
  8  |   });
  9  | 
  10 |   test("shows empty state when no services", async ({ page }) => {
  11 |     await page.route("https://app-api.sabturno.com/service/bylocal/*", async (route) => {
  12 |       await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  13 |     });
  14 | 
  15 |     await page.goto("/local/services");
  16 |     await expect(page.getByText("No hay servicios registrados")).toBeVisible();
  17 |   });
  18 | 
  19 |   test("creates a new service", async ({ page }) => {
  20 |     await page.route("https://app-api.sabturno.com/service", async (route) => {
  21 |       if (route.request().method() === "POST") {
  22 |         await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(mockServiceCreated) });
  23 |       }
  24 |     });
  25 | 
  26 |     await page.goto("/local/services/edit/new");
  27 |     await page.getByLabel("Nombre del servicio").fill("Nuevo Servicio");
  28 |     await page.getByLabel("Descripcion (opcional)").fill("Descripción del servicio");
  29 |     await page.getByLabel("Precio (ARS)").fill("4000");
  30 |     await page.getByLabel("Duracion (minutos)").fill("60");
  31 |     await page.getByRole("button", { name: "Crear servicio" }).click();
  32 |     await expect(page).toHaveURL(/\/local\/services/);
  33 |   });
  34 | 
  35 |   test("edits an existing service", async ({ page }) => {
  36 |     await page.route("https://app-api.sabturno.com/service/bylocal/*", async (route) => {
  37 |       await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockServices) });
  38 |     });
  39 | 
  40 |     await page.goto("/local/services/edit/1");
  41 |     await page.waitForSelector('input[value="Corte de cabello"]', { timeout: 10000 });
  42 |     await page.getByLabel("Nombre del servicio").fill("Corte moderno");
  43 |     await page.getByRole("button", { name: "Guardar cambios" }).click();
  44 |     await expect(page).toHaveURL(/\/local\/services/);
  45 |   });
  46 | 
  47 |   test("deletes a service", async ({ page }) => {
  48 |     await page.route("https://app-api.sabturno.com/service/bylocal/*", async (route) => {
  49 |       await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockServices) });
  50 |     });
  51 | 
  52 |     await page.goto("/local/services");
  53 |     await page.getByRole("button", { name: "Eliminar" }).first().click();
> 54 |     await page.getByRole("button", { name: "Eliminar", exact: true }).click({ force: true });
     |                                                                       ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Eliminar', exact: true }) resolved to 3 elements:
  55 |   });
  56 | });
  57 | 
```