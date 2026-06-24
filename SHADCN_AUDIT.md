# Auditoría shadcn/ui — SabTurno client-web

> Documento de trabajo de la sesión. Tracking de pendientes y progreso durante
> la migración a shadcn/ui. Se actualiza a medida que se completan tareas.

## Contexto

- **Proyecto**: `client-web/` (SabTurno SPA).
- **Stack real**: Next.js 16 (App Router) + React 19 + Tailwind v4 (CSS-first) +
  TypeScript estricto.
- **NOTA**: `AGENTS.md` dice Vite 7 + React Router 7 — está **desactualizado**,
  ignorar.
- **shadcn CLI**: ya configurado (`components.json`, estilo `new-york`, base
  color `neutral`, css vars activadas, alias `@/components/ui`, icon lib
  `lucide`).
- **shadcn instalado**: ❌ todavía no hay `src/components/ui/`.
- **CSS vars shadcn**: ✅ ya existen en `src/styles.css` con formato HSL y
  brand color verde neón (`--primary: 149 100% 47%` ≈ `#00f068`).
- **Tema**: dark-only, copy en español.
- **Idiomas de copy**: "Cargando...", "Mis turnos", etc.

## Convenciones a respetar

- Path alias `@/*` → `./src/*`. **Siempre** `@/`, nunca `../../../`.
- Tailwind v4 — **NO** agregar `tailwind.config.js`. Tokens en `src/styles.css`.
- No inventar scripts (`npm run lint`, `npm run deploy`, etc. no existen salvo
  los del `package.json` actual: `dev`, `build`, `start`, `typecheck`, `test`,
  `test:run`, `test:coverage`, `test:e2e`).
- `lucide-react` ya está en `package.json` — usarlo, no definir SVGs inline.
- `class-variance-authority`, `clsx`, `tailwind-merge` ya instalados — los usa
  shadcn.
- **No tocar** `src/lib/api.ts` ni `src/services/booking.ts` (cache-bust
  intencional en `time_stock/*`).
- **No romper** el patrón de auth gating con `useAuthStore().hasHydrated`.
- **No** commitear `.env` ni `.env.production` (gitignored).
- Conventional commits en español: `feat`, `fix`, `refactor`, `style`, `chore`.

## Inventario de páginas y componentes (43 pages + 17 components)

### Páginas
- **Auth (6)**: `/login`, `/register`, `/forgot-password`, `/reset-password`,
  `/verified`, `(auth)/layout.tsx`.
- **Cliente (7)**: `/home`, `/appointments`, `/payments`, `/profile`,
  `/profile/edit`, `/reports`, `(client)/layout.tsx`.
- **Local-owner (15)**: `/local/dashboard`, `/local/calendar`, `/local/timeline`,
  `/local/schedules`(+ edit), `/local/blockings`, `/local/employees`(+ edit),
  `/local/services`(+ edit), `/local/images`, `/local/payment-methods`(+ talo
  callback), `/local/profile`, `(local)/layout.tsx`.
- **Booking (8)**: `/booking/select-local`, `/booking/select-service`,
  `/booking/page.tsx`, `/booking/appointment`, `/booking/payment`,
  `/booking/payment-status`, `/booking/result`, `booking/layout.tsx`.
- **Públicas (3)**: `/appointment/[id]`, `/appointment/[id]/cancel`,
  `/demo/timeline` (dev leftover).
- **Globales (4)**: `app/page.tsx`, `app/layout.tsx`, `app/loading.tsx`,
  `app/not-found.tsx`.

### Componentes custom actuales
- `Button` (4 variants) → shadcn `Button` con `cva`
- `Field` (`InputField`/`SelectField`/`TextareaField`) → shadcn `Input`,
  `Label`, `Field` (nuevo)
- `ConfirmDialog` (modal custom) → shadcn `Dialog` (Radix, animations + a11y)
- `StatCard`, `LocalStatsCard` → shadcn `Card`
- `LocalCard`, `ServiceCard`, `AppointmentCard` → shadcn `Card`
- `LocalNavCard` → shadcn `Card` + `Button asChild`
- `ReportDialog` → shadcn `Dialog` + `Form`
- `CalendarEventComponent` (en calendario) → mejora con `Tooltip`/`Badge`
- `EmployeeSidebar` → shadcn `Sheet`/`Sidebar`
- `TaloPaymentInfo`, `PaymentMethodCard` → shadcn `Card` + `Badge`
- SVGs inline en pages (4 iconos en dashboard, mobile menu, etc.) → `lucide-react`

---

## Progreso

### ✅ Fase 0 — Setup base
- [x] Auditar `utils.ts`, `tsconfig`, `components.json` y `styles.css`.
- [x] Confirmar que `cn()` existe en `src/lib/utils.ts`.
- [x] Confirmar path alias `@/*` en `tsconfig.json`.
- [x] Crear este archivo de tracking.
- [x] Instalar primitivos shadcn con `npx shadcn@latest add`.
- [x] Validar con `npm run typecheck` (pasa limpio).
- [x] Instalar `radix-ui` umbrella package (auto por shadcn).
- [x] Componentes instalados (14): `button`, `input`, `label`, `card`, `dialog`,
      `badge`, `sheet`, `dropdown-menu`, `tabs`, `separator`, `skeleton`,
      `avatar`, `alert`, `tooltip`.

### ⏳ Fase 1 — Reemplazo de primitives custom → shadcn
- [x] `Button` custom → `Button` shadcn (wrapper retrocompatible, mantiene
      API legacy, 32 imports funcionan sin cambios).
- [x] `ConfirmDialog` → `Dialog` shadcn (mantiene API, 4 imports existentes
      sin cambios; gana animaciones + focus trap + escape + aria).
- [x] `Field` (`InputField`/`SelectField`/`TextareaField`) → `Input` + `Label`
      + `Textarea` shadcn. 9 imports sin cambios.
- [x] `StatCard` (sin uso), `LocalStatsCard`, `LocalNavCard` → `Card` shadcn.
      LocalStatsCard (4 usos en dashboard) y LocalNavCard (5+2 usos) sin
      cambios en callers. StatCard marcado como `@deprecated`.
- [x] `ServiceCard` (1 import, select-service), `LocalCard` (1 import,
      select-local), `AppointmentCard` (sin uso) → tokens `bg-card` + `border`
      + `shadow-sm`. Status chips con `emerald`/`amber`/`rose` en vez de
      `#00f068`/`#f0c040`/`#ff5678`.
- [ ] `ReportDialog` → `Dialog` + `Form`.

### ⏳ Fase 2 — Pantallas (por impacto visual)
- [ ] `(client)/layout.tsx` — sidebar desktop + `Sheet` mobile.
- [ ] `(local)/layout.tsx` — sidebar / nav.
- [ ] Auth pages — login, register, forgot, reset, verified.
- [ ] Home cliente + Dashboard local.
- [ ] Booking flow (respetar cache-bust en `time_stock/*`).

### ⏳ Fase 3 — Polish
- [ ] Reemplazar SVGs inline por `lucide-react`.
- [ ] `app/loading.tsx` con `Skeleton` shadcn.
- [ ] Toasts con `sonner` para feedback de mutaciones (login, booking, etc.).
- [ ] Añadir micro-interacciones y focus rings consistentes.
- [ ] Auditoría responsive en mobile/tablet/desktop.

---

## Decisiones técnicas

- **Versión shadcn**: usar la última (`npx shadcn@latest`).
- **Tailwind v4**: los componentes shadcn en v4 no requieren
  `tailwindcss-animate` (animaciones se hacen con `tw-animate-css` o CSS
  nativo). Validar tras instalar.
- **Path de componentes**: shadcn va a `src/components/ui/` (alias `@/ui`).
- **Color de marca**: mantener verde neón `--primary: 149 100% 47%`. No cambiar
  paleta sin OK del usuario.
- **Tipografía**: mantener Space Grotesk (display) + Manrope (body). Ya
  cargadas vía `next/font/google` en `app/layout.tsx`.
- **CVA vs classnames**: shadcn usa `cva` — ya está como dep.

## Bitácora de cambios

- **Fase 0 (2026-06-15)**: setup completo. `npx shadcn@latest` v4.11.0 detecta
  Tailwind v4 correctamente. Se instala `radix-ui` (umbrella). 14 componentes
  UI en `src/components/ui/`. `npm run typecheck` pasa limpio.
  - Archivos creados: `button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`,
    `dialog.tsx`, `badge.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `tabs.tsx`,
    `separator.tsx`, `skeleton.tsx`, `avatar.tsx`, `alert.tsx`, `tooltip.tsx`.
  - **Pendiente**: envolver `app/layout.tsx` con `TooltipProvider` cuando se
    use `Tooltip` (no urgente, hacerlo en la primera página que lo use).
  - **No se instaló todavía**: `sonner` (Fase 3), `form` (opcional, requiere
    `react-hook-form`).
- **Fase 1 / Button (2026-06-15)**: `Button.tsx` reescrito como wrapper
  retrocompatible sobre el `Button` shadcn. **32 archivos** importan Button
  y siguen funcionando sin cambios. Mapping:
  - `primary` → `default` (verde neón)
  - `secondary` → `secondary`
  - `danger` → `destructive` (rojo)
  - `ghost` → `ghost`
  - `fullWidth` → `w-full`
  - Se re-exporta `ShadcnButton` y `buttonVariants` para uso directo (variants
    nativas `outline`, `link`; `size`; `asChild`).
  - Decisión visual: usar `rounded-xl` y `px-5 py-2.5` para mantener el
    lenguaje de radios del brand (más generoso que `rounded-md` default de
    shadcn). Mantengo `hover:-translate-y-px` para el sutil lift.
  - `type` default a `"button"` para evitar submits accidentales en forms
    (era un riesgo en el custom original).
  - `npm run typecheck` pasa limpio.
- **Fase 1 / ConfirmDialog (2026-06-15)**: `ConfirmDialog.tsx` reescrito con
  shadcn `Dialog` (Radix). Gana:
  - Animaciones enter/exit (fade + zoom).
  - Focus trap automático.
  - Escape key cierra.
  - Backdrop click cierra (via `onOpenChange`).
  - Roles ARIA correctos (`DialogTitle`, `DialogDescription`).
  - Se instaló `tw-animate-css` en `package.json` y `@import "tw-animate-css"`
    en `styles.css` para las animaciones.
  - 4 archivos que importan `ConfirmDialog` sin cambios. `typecheck` pasa limpio.
- **Fase 1 / Field (2026-06-15)**: `Field.tsx` reescrito usando `Input` + `Label`
  + `Textarea` de shadcn. Se instaló `textarea` shadcn. Cambios:
  - `InputField`: `Label` + `Input` shadcn + `trailing` como overlay absoluto.
  - `SelectField`: `Label` + `<select>` nativo estilizado con las mismas clases
    que el `Input` (border, ring, focus, disabled).
  - `TextareaField`: `Label` + `Textarea` shadcn (`field-sizing-content` nativo
    para altura automática).
  - Hint usa `text-muted-foreground` (token del theme). Errores usan
    `text-destructive` (rojo del brand). Wrapper `div.grid.gap-1.5` en vez de
    `<label>` semántico — cada `<Label>` tiene su `htmlFor` para mantener
    accesibilidad.
  - 9 archivos importan `Field` y siguen funcionando sin cambios.
  - Se eliminaron colores hardcodeados (`text-white/88`, `border-white/16`,
    `text-rose-300`). Todo va por tokens del theme.
- **Fase 1 / Dashboard Cards (2026-06-15)**: 3 componentes migrados:
  - `StatCard` (sin uso): `Card` + `CardHeader`/`CardDescription`/`CardTitle`/`CardContent`.
    Marcado `@deprecated`. Hover effect: `hover:-translate-y-0.5 hover:border-[#00f068]/38`.
  - `LocalStatsCard` (4 usos en dashboard): Misma API. Icono posicionado vía
    `CardAction` en header, trend/children en `CardContent` con flex. Trend
    verde `text-emerald-400` / rojo `text-rose-400` (semánticos).
  - `LocalNavCard` (7 usos: dashboard + calendar): Link estilizado con las
    mismas clases que `Card` (`rounded-xl border bg-card shadow-sm`). Título
    con `text-primary` y `tracking-[0.22em]` (brand). Descripción con
    `text-muted-foreground`. Icono con `text-muted-foreground`.
  - Se eliminaron: `bg-[linear-gradient(...)]`, `backdrop-blur-[12px]`,
    `shadow-[0_16px_40px_...]`, `text-white/70`, `text-white/40`,
    `rounded-[28px]` (reemplazado por `rounded-xl` de shadcn).
- **Fase 1 / Booking Cards (2026-06-15)**: `ServiceCard`, `LocalCard`,
  `AppointmentCard` migrados:
  - **ServiceCard** (booking select-service): button con clases `bg-card border
    shadow-sm rounded-xl`. Icono inicial con `rounded-xl border-primary/20
    bg-primary/10 text-primary`. Badge duración `bg-muted text-muted-foreground`,
    badge precio `border-primary/20 bg-primary/10 text-primary`.
  - **LocalCard** (booking select-local): mismo patrón. Avatar con fallback a
    inicial/`primary/20`. Ícono ubicación SVG mantenido. Badges de medios de
    pago (MP/Efectivo/Reserva) con `bg-muted text-muted-foreground`.
  - **AppointmentCard** (sin uso, future-proof): dos variantes (default + primary).
    Status chips migrados de hex hardcodeados a tokens semánticos Tailwind:
    `emerald-500` (CONFIRMED), `amber-400` (PENDING), `rose-500` (CANCELLED),
    `text-muted-foreground` (COMPLETED). Variante primary con `bg-primary` +
    `text-primary-foreground` + chips invertidos. Cancel button usa `Button`
    (ya shadcn).
  - **AppointmentsEmptyState** (co-exportado, sin uso): empty state con
    `rounded-xl border bg-card`, icon circle `border-primary/20 bg-primary/10
    text-primary`, `text-muted-foreground` para copy.
  - Se eliminaron: `bg-gradient-to-b from-[rgba(22,22,22,0.96)] to-[rgba(12,12,12,0.95)]`,
    `rounded-[20px]`, `rounded-[16px]`, `shadow-[0_16px_40px_...]`,
    `backdrop-blur-[12px]`, `text-white/52`, `text-white/70`, `text-white/30`,
    `text-white/50`, `text-white/40`, `bg-white/6`, `border-white/10`,
    `bg-[#12141a]`, `text-[#f0c040]`.

## Próximos pasos

1. **Fase 1 — Atomic primitives**: el corazón del refactor. Vamos a empezar
   por **`Button` custom → `Button` shadcn**. Esto afecta a **13 páginas** que
   importan de `@/components/Button`.
2. Antes de tocar `Button`:
   - Definir mapping: `primary` → `default`, `secondary` → `secondary`,
     `danger` → `destructive`, `ghost` → `ghost`. Mantener prop `fullWidth` (o
     migrar a `className="w-full"`).
   - Decidir si reemplazamos imports globalmente o por página (mi
     recomendación: por página para evitar un cambio masivo y poder testear).
3. **ConfirmDialog** es la mejor candidata para segundo: 1 archivo custom
   aislado, usado en cancelaciones y report dialogs.
4. **`StatCard` y `LocalCard`** son buenos terceros: muy usados en dashboard.

