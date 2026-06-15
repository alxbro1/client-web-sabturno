# AGENTS.md

Repo: SabTurno client web (React 19 + Vite 7 + React Router 7, customer-facing SPA in Spanish).
Companion Expo app shares contracts; this repo consumes `https://app-api.sabturno.com`.

## Commands

- `npm run dev` — Vite dev server.
- `npm run build` — runs `tsc -b` then `vite build`. Use the same order for verification.
- `npm run typecheck` — `tsc --noEmit` only; use this for a fast check.
- `npm run test` — `vitest` (watch). `npm run test:run` for single-run (CI-style).

There is no lint or formatter configured (no eslint/prettier in `package.json`). Do not invent one without being asked.

## Layout

- `src/main.tsx` → `src/router.tsx` → shells in `src/shell/`. All pages are `lazy()` + `Suspense`; register new pages in `router.tsx` with the same pattern.
- `src/lib/api.ts` — single axios instance. Sets `Authorization: Bearer <token>` from `useAuthStore` and `Cache-Control: no-store` for `/time_stock/available-days` and `/time_stock/availability` GETs.
- `src/services/*` — thin wrappers over `apiService`; pages/hooks call these. Do not import `axios` outside `lib/api.ts`.
- `src/stores/auth.ts` — Zustand store, persisted under key `sabturno-client-auth` in `localStorage` via `src/lib/storage.ts` (SSR-safe noop fallback).
- `src/stores/booking.ts` — booking flow state (local → service → date → time → payment). Setters cascade-reset later fields; `bumpAvailability()` invalidates slot data.
- `src/components/*` — shared UI (Button, Field, Icons, TaloPaymentInfo, cards). `src/components/local/*` is local-owner-only.
- `src/pages/` — client pages. `src/pages/local/*` is the local-owner dashboard (bookable-locals admin). `src/pages/demo/` is a leftover dev demo (`/demo/timeline`).
- `src/features/<feature>/` — vertical slice folders with `index.ts` barrel exporting types/constants/services/hooks/utils. Two exist: `local` and `appointment-timeline`.
- `src/hooks/*` — page-level composables. `useBookingFlow` is the canonical booking navigation helper.
- `src/views/` is empty; ignore it.

## Conventions

- Path alias `@/*` → `./src/*` is wired in `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`. Use it everywhere; don't add new relative `../../../` chains.
- Tailwind v4 is loaded via `@tailwindcss/vite` and `@import "tailwindcss";` in `src/styles.css`. There is no `tailwind.config.js`; design tokens are CSS variables on `:root` in `styles.css` (brand neon `#00f068`, danger `#ff5678`, etc.). New tokens go in that file.
- Dark-only theme; UI strings are in Spanish ("Cargando...", "Mis turnos"). Match existing copy.
- React Router v7 data APIs are not used — routing is `createBrowserRouter` + JSX `element` + lazy imports. `basename` is `import.meta.env.BASE_URL` (set via Vite `base`; default `/`).
- Public appointment links (`/appointment/:id`, `/appointment/:id/cancel`) are outside `ProtectedShell` and use `hash` query param auth (`bookingService.getAppointmentPublic`/`cancelAppointmentPublic`).
- Local-owner routes are gated indirectly in `AuthLayout` (redirects to `/home` if `user.isLocal` is false). `LocalOwnerShell` enforces auth; check both before adding local-only routes.
- Always gate auth-gated UI on `useAuthStore().hasHydrated` (see `ProtectedShell`, `AuthLayout`, `RootRedirect`) — otherwise persisted state flickers through `/login` on reload.
- Cache-busting on availability endpoints is intentional (slots change in real time). Don't remove the `withCacheBust` calls in `src/services/booking.ts` or the request interceptor headers in `api.ts`.

## Environment

- Required: `VITE_API_URL` (e.g. `https://app-api.sabturno.com`). `.env.example` documents it; `lib/api.ts` falls back to the production URL when unset.
- `.env` and `.env.production` are gitignored. Do not commit them.
- `VITE_BASE_PATH` (or Vite `base`) controls the app subpath; `index.html` uses `%BASE_URL%` for asset URLs.

## Tests

- No test files exist in the repo despite `vitest.config.ts` being present. Setup is at `src/test/setup.ts` (only imports `@testing-library/jest-dom/vitest`). The first `*.test.ts(x)` you add under `src/` will be picked up.

## Deploy

- `./deploy.sh` (not `npm run deploy`). It expects `./dist` to already exist (`npm run build` first), then rsyncs to `ubuntu@54.210.182.128:/home/ubuntu/app` using a hardcoded PEM key path under `~/Desktop/Credentials/PEM/`. Fail loudly if the dist is missing or the key isn't on disk.
- There is no CI; deploys are manual from a machine with the PEM key.

## Skills

Repo-local skills under `.agents/skills/` (composition-patterns, react-best-practices, frontend-design, tailwind-css-patterns, vite, etc.) are auto-loaded by opencode via `skills-lock.json` — prefer them over generic advice for React composition, performance, and Tailwind work.
