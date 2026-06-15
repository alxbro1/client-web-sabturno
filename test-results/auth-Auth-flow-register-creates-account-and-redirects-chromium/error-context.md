# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Auth flow >> register creates account and redirects
- Location: src/e2e/specs/auth.spec.ts:10:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Crear cuenta' })
    - locator resolved to <button disabled type="submit" class="border rounded-2xl px-[1.15rem] py-[0.9rem] cursor-pointer font-semibold transition-[opacity,transform,border-color,background-color,color,box-shadow] duration-[140ms] ease-in-out hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f068]/50 text-[#07150d] border-transparent bg-[linear-gradient(180deg,#6bffb0_0%,#00f068_100%)] hover:shadow-[0_16px_34px_rgba(0,240,104,0.26)] w-f…>Crear cuenta</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    54 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "SabTurno" [ref=e6]
      - generic [ref=e7]:
        - paragraph [ref=e8]: Nuevo cliente
        - heading "Crea tu cuenta" [level=2] [ref=e9]
        - paragraph [ref=e10]: Completa tus datos para reservar turnos desde la web.
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Nombre
          - textbox "Nombre" [ref=e16]: Test User
        - generic [ref=e17]:
          - generic [ref=e18]: Telefono
          - textbox "Telefono Formato de telefono invalido" [ref=e20]: "+541112345678"
          - generic [ref=e21]: Formato de telefono invalido
      - generic [ref=e22]:
        - generic [ref=e23]: Correo electronico
        - textbox "Correo electronico" [ref=e25]: test@example.com
      - generic [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]: Contrasena
          - textbox "Contrasena" [ref=e30]: TestPass123!
        - generic [ref=e31]:
          - generic [ref=e32]: Confirmar Contrasena
          - textbox "Confirmar Contrasena" [ref=e34]: TestPass123!
      - generic [ref=e35]:
        - generic [ref=e36]:
          - generic [ref=e37]: Fecha de nacimiento
          - textbox "Fecha de nacimiento" [ref=e39]: 1990-01-15
        - generic [ref=e40]:
          - generic [ref=e41]: Pais
          - combobox "Pais" [ref=e42]:
            - option "Argentina" [selected]
      - generic [ref=e43]:
        - generic [ref=e44]: Zona horaria
        - combobox "Zona horaria" [ref=e45]:
          - option "Buenos Aires" [selected]
      - generic [ref=e46]:
        - checkbox "Acepto los terminos y condiciones y la politica de privacidad." [checked] [active] [ref=e47]
        - generic [ref=e48]:
          - text: Acepto los
          - link "terminos y condiciones" [ref=e49] [cursor=pointer]:
            - /url: https://sabturno.com/terminos-y-condiciones.html
          - text: y la
          - link "politica de privacidad" [ref=e50] [cursor=pointer]:
            - /url: https://sabturno.com/politica-de-privacidad.html
          - text: .
      - button "Crear cuenta" [disabled] [ref=e51]
    - link "Ya tienes cuenta? Inicia sesion" [ref=e53] [cursor=pointer]:
      - /url: /login
  - button "Open Next.js Dev Tools" [ref=e59] [cursor=pointer]:
    - img [ref=e60]
  - alert [ref=e63]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { mockUser, mockToken } from "../fixtures/mockData";
  3  | 
  4  | test.describe("Auth flow", () => {
  5  |   test("redirects unauthenticated users to /login", async ({ page }) => {
  6  |     await page.goto("/home");
  7  |     await expect(page).toHaveURL(/\/login\?from=%2Fhome/);
  8  |   });
  9  | 
  10 |   test("register creates account and redirects", async ({ page }) => {
  11 |     await page.route("**/auth/register", async (route) => {
  12 |       await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  13 |     });
  14 | 
  15 |     await page.goto("/register");
  16 |     await page.getByLabel("Nombre").fill("Test User");
  17 |     await page.getByLabel("Telefono").fill("+541112345678");
  18 |     await page.getByLabel("Correo electronico").fill("test@example.com");
  19 |     await page.getByLabel("Contrasena", { exact: true }).fill("TestPass123!");
  20 |     await page.getByLabel("Confirmar Contrasena").fill("TestPass123!");
  21 |     await page.getByLabel("Fecha de nacimiento").fill("1990-01-15");
  22 |     await page.getByLabel("Pais").selectOption("AR");
  23 |     await page.getByRole("checkbox").check();
> 24 |     await page.getByRole("button", { name: "Crear cuenta" }).click();
     |                                                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
  25 | 
  26 |     await expect(page).toHaveURL(/\/login\?emailVerificationPending=true/);
  27 |   });
  28 | 
  29 |   test("login successful and redirects to dashboard", async ({ page }) => {
  30 |     await page.route("**/api/auth/login", async (route) => {
  31 |       await route.fulfill({
  32 |         status: 200,
  33 |         headers: {
  34 |           "Set-Cookie": "sabturno_session=mock-token; Path=/; HttpOnly; SameSite=Lax",
  35 |         },
  36 |         contentType: "application/json",
  37 |         body: JSON.stringify({ user: mockUser, token: mockToken }),
  38 |       });
  39 |     });
  40 | 
  41 |     await page.goto("/login");
  42 |     await page.getByLabel("Correo electronico").fill("test@example.com");
  43 |     await page.getByLabel("Contrasena").fill("password123");
  44 |     await page.getByRole("button", { name: "Iniciar sesion" }).click();
  45 | 
  46 |     await expect(page).toHaveURL(/\/local\/dashboard/);
  47 |   });
  48 | 
  49 |   test("redirects authenticated users from /login to /home", async ({ page }) => {
  50 |     await page.context().addCookies([
  51 |       { name: "sabturno_session", value: mockToken, domain: "localhost", path: "/" },
  52 |     ]);
  53 |     await page.route("**/api/auth/me", async (route) => {
  54 |       await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: mockUser, token: mockToken }) });
  55 |     });
  56 | 
  57 |     await page.goto("/login");
  58 |     await expect(page).toHaveURL(/\/home/);
  59 |   });
  60 | });
  61 | 
```