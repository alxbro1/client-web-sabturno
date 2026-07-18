# AGENTS.md

Repo: SabTurno client web (Next.js 16 App Router, customer-facing SPA in Spanish).
Companion Expo app shares contracts; this repo consumes `https://app-api.sabturno.com`.

## Commands

- `npm run dev` — Next.js dev server (Turbopack).
- `npm run build` — `next build`. Generates `.next/` directory.
- `npm run start` — `next start` (production server).
- `npm run typecheck` — `tsc --noEmit` only; use this for a fast check.
- `npm run test` — `vitest` (watch). `npm run test:run` for single-run (CI-style).
- `npm run lint` — `next lint` (ESLint).
- `npm run clean` — `./clean.sh` (borra `.next/` y `node_modules/.cache/`).
- `./deploy.sh` — Build + sync a S3 (`app.sabturno.com`). Amplify detecta cambios automáticamente.

## Layout (Next.js 16 App Router)

- `src/app/layout.tsx` — Root layout (providers, fonts, global styles).
- `src/app/page.tsx` — Home page (`/`).
- `src/app/(auth)/` — Auth routes group (login, register, forgot-password).
- `src/app/(client)/` — Client routes group (home, booking, appointments, profile).
- `src/app/(local)/` — Local-owner routes group (dashboard, calendar, employees, services).
- `src/app/api/` — API routes (used in production).
- `src/app/appointment/` — Public appointment links (`/appointment/[id]`, `/appointment/[id]/cancel`).
- `src/app/booking/` — Booking flow (select-local, select-service, select-slot, payment, result).
- `src/app/demo/` — Leftover dev demo (`/demo/timeline`).

### Shared code (still in `src/`)

- `src/lib/api.ts` — Single axios instance. Sets `Authorization: Bearer <token>` from `getSession()` (NextAuth) and `Cache-Control: no-store` for `/time_stock/available-days` and `/time_stock/availability` GETs.
- `src/services/*` — Thin wrappers over `apiService`; pages/hooks call these. Do not import `axios` outside `lib/api.ts`.
- `src/stores/booking.ts` — Booking flow state (local → service → date → time → payment). Setters cascade-reset later fields; `bumpAvailability()` invalidates slot data.
- `src/stores/auth.ts` — **OBSOLETO.** Zustand store viejo, ya no se usa. La autenticación ahora es via NextAuth (`src/hooks/useAuth.ts`).
- `src/components/*` — Shared UI (Button, Field, Icons, TaloPaymentInfo, cards). `src/components/local/*` is local-owner-only.
- `src/features/<feature>/` — Vertical slice folders with `index.ts` barrel exporting types/constants/services/hooks/utils. Two exist: `local` and `appointment-timeline`.
- `src/hooks/*` — Page-level composables. `useBookingFlow` is the canonical booking navigation helper.
- `src/views/` is empty; ignore it.

## NextAuth v5 (auth layer)

La autenticación usa NextAuth v5 (Auth.js) con JWT strategy y Credentials provider.

### Archivos clave
- `src/lib/auth.ts` — Config NextAuth (providers, callbacks, pages)
- `src/app/api/auth/[...nextauth]/route.ts` — API route handler
- `src/hooks/useAuth.ts` — Hook de compatibilidad (misma interfaz que tenía `useAuthStore`)

### ⚠️ CRÍTICO: Callbacks de JWT y Session

En `src/lib/auth.ts`, el callback `session` DEBE propagar `token.sub` como
`session.user.id`. Sin esto, `user.id` queda como `""` y TODOS los endpoints
que usan el ID en la URL fallan con 404 silencioso.

```ts
async session({ session, token }) {
  (session as any).accessToken = token.accessToken;
  if (session.user) {
    (session.user as any).id = token.sub;  // ← OBLIGATORIO
    (session.user as any).isLocal = token.isLocal;
    (session.user as any).phone = token.phone;
    (session.user as any).localName = token.localName;
  }
  return session;
},
```

Campos custom que se propagan: `accessToken`, `isLocal`, `phone`, `localName`, `id`.

### Checklist al modificar auth
- [ ] `session.user.id` = `token.sub` en callback session
- [ ] Actualizar mocks en `__tests__/` que referencien `useAuthStore` → `useAuth`
- [ ] Verificar que `useAuth().user.id` no sea `""` antes de usar en URLs
- [ ] Tests E2E: mockear AMBOS `/api/auth/callback/credentials` Y `/api/auth/session`
- [ ] `signIn("credentials")` devuelve `{ url, error }`, NO `{ user, token, ok }`
- [ ] Para obtener datos del usuario post-login: `getSession()` de `next-auth/react`

### Mocking en tests E2E (Playwright)

NextAuth requiere mockear DOS endpoints:

```ts
let signInAttempted = false;

await page.route("**/api/auth/**", async (route, request) => {
  const url = request.url();

  if (url.includes("/api/auth/callback/credentials")) {
    signInAttempted = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "http://localhost:3001/redirect-path" }),
    });
    return;
  }

  if (url.includes("/api/auth/session") && signInAttempted) {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "user-id", name: "Test", email: "test@example.com", isLocal: true },
        accessToken: "mock-token",
        expires: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    return;
  }

  await route.continue();
});
```

### Mocking en tests unitarios (Vitest)

```ts
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "local-1", isLocal: true, name: "Test", email: "test@example.com" },
    token: "mock-token",
    hasHydrated: true,
    isLoading: false,
    logout: vi.fn(),
    updateUserProfile: vi.fn(),
  }),
}));
```

## Conventions

- Path alias `@/*` → `./src/*` is wired in `tsconfig.json` and `vitest.config.ts`. Use it everywhere; don't add new relative `../../../` chains.
- Tailwind v4 is loaded via `@tailwindcss/postcss` and `@import "tailwindcss";` in `src/styles.css`. There is no `tailwind.config.js`; design tokens are CSS variables on `:root` in `styles.css` (brand neon `#00f068`, danger `#ff5678`, etc.). New tokens go in that file.
- Dark-only theme; UI strings are in Spanish ("Cargando...", "Mis turnos"). Match existing copy.
- Next.js App Router conventions: `page.tsx` for pages, `layout.tsx` for layouts, `loading.tsx` for loading states, `not-found.tsx` for 404.
- Route groups `(auth)`, `(client)`, `(local)` for layout scoping (not URL segments).
- Public appointment links (`/appointment/[id]`, `/appointment/[id]/cancel`) are outside protected layouts and use `hash` query param auth (`bookingService.getAppointmentPublic`/`cancelAppointmentPublic`).
- Local-owner routes are gated indirectly in `(local)/layout.tsx` (redirects to `/home` if `user.isLocal` is false). Check both auth and ownership before adding local-only routes.
- Always gate auth-gated UI on `useAuth().hasHydrated` (see layout files) — otherwise the session loading state flickers through `/login` on reload.
- Cache-busting on availability endpoints is intentional (slots change in real time). Don't remove the `withCacheBust` calls in `src/services/booking.ts` or the request interceptor headers in `api.ts`.

## Environment

- Required: `NEXT_PUBLIC_API_URL` (e.g. `https://app-api.sabturno.com`). Falls back to production URL when unset.
- Optional: `NEXT_PUBLIC_BASE_PATH` (app subpath, default empty).
- `.env`, `.env.local`, `.env.production` are gitignored. Do not commit them.

## Tests

- Vitest configured in `vitest.config.ts`. Setup at `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`).
- Playwright configured in `playwright.config.ts` for E2E tests.
- Test files: `*.test.ts(x)` under `src/`.

## Deploy

- **Stack:** S3 + Amplify. Bucket: `app.sabturno.com`. CloudFront Distribution: `EPA4X8K2B4OH4`. Domain: `appweb.sabturno.io`.
- **Flujo:** `./deploy.sh` ejecuta `npm run build` + `aws s3 sync .next s3://app.sabturno.com --delete --profile sabturno`. Amplify detecta cambios en S3 automáticamente y hace el deploy.
- **Manual:** No hay CI/CD. Deploy bajo demanda.
- **API routes:** Se usan en producción. No usar `output: 'export'` en `next.config.ts`.
- **AWS Profile:** `sabturno` (credenciales en `~/.aws/credentials`). No usar el perfil default.

## Troubleshooting

### Mercado Pago abre estado/401 en vez del checkout

- Confirmar en la respuesta de `POST /appointments` que existe `mercadoPago.initPoint` y navegar a ese valor con `window.location.assign()`.
- `externalReference` sólo identifica el pago; no es una URL. No llamar al endpoint de estado antes de volver de Mercado Pago.
- Para invitados, propagar `accessHash` por el retorno y usar `/payments/guest/by-external-reference/:reference`; el endpoint sin `/guest` requiere JWT.
- El backend valida el retorno web y lo limita a `/booking/payment-status`. Cambios en este flujo requieren la skill `backend/.agents/skills/mercadopago-checkout/SKILL.md`.

### ENOTEMPTY: directory not empty, rmdir '.next/server'

**Causa:** Procesos zombie de `next dev` (Turbopack) que mantienen handles abiertos en `.next/server/`.

**Solución:**
1. Identificar el proceso con `lsof -nP -iTCP:3001 -sTCP:LISTEN` y cerrarlo normalmente. Usar `kill -9` sólo si no responde.
2. Limpiar caché: `npm run clean` (ejecuta `./clean.sh` que borra `.next/` y `node_modules/.cache/`)
3. Reconstruir: `npm run build`

**Prevención:** Cerrar `next dev` con `Ctrl+C` antes de ejecutar `npm run build`. Si el build falla repetidamente, ejecutar `npm run clean` primero.

### AccessDenied en S3 sync (deploy.sh)

**Causa:** El perfil de AWS default no tiene permisos para el bucket `app.sabturno.com`.

**Solución:** Usar el perfil `sabturno` configurado en `~/.aws/credentials`:
```bash
aws s3 ls --profile sabturno  # Verificar acceso al bucket
./deploy.sh                    # El script usa --profile sabturno automáticamente
```

**Nota:** `deploy.sh` NO ejecuta `set -e` porque `aws s3 sync` puede fallar parcialmente (algunos archivos suben, otros no). Revisar el output manualmente para confirmar que todos los archivos subieron exitosamente.

## Skills

Repo-local skills under `.agents/skills/` (composition-patterns, react-best-practices, frontend-design, tailwind-css-patterns, vite, nextauth-migration, etc.) are auto-loaded by opencode via `skills-lock.json` — prefer them over generic advice for React composition, performance, and Tailwind work.

## Time handling

**Lee `docs/time-handling.md` antes de tocar fechas, horarios, time-stocks o
availability.** Resumen no negociable:

- Mostrar datetimes: usá `formatInTimeZone` / `toZonedTime` de
  `src/lib/utils/date.ts`. **Nunca** `toTimeString()` / `toDateString()` /
  `toLocaleString()` para formatear salida al usuario.
- Enviar al backend:
  - ISO datetime → `date.toISOString()`.
  - Fecha `YYYY-MM-DD` → día local del usuario.
  - `HH:mm` de time-slot → UTC (`date.toISOString().slice(11, 16)`).
  - `HH:mm` de full-day → hora local + zona explícita en el body.
- Comparar días: normalizar a string con TZ (`formatInTimeZone(d, tz, 'yyyy-MM-dd')`).
- Helpers canónicos en `src/lib/utils/date.ts`:
  `formatLocalDate`, `formatDateOnlyLocal`, `getFriendlyDateTime`,
  `toDate`, `utcDateTimeToLocalParts`, `convertLocalToUTC`.
- Endpoint `time_stock/*` mantiene cache-bust (`Cache-Control: no-store`).
  No lo remuevas.
