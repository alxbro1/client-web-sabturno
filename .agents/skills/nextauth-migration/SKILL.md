# NextAuth v5 Migration — client-web/

Skill para migrar, mantener o depurar la autenticación con NextAuth v5 (Auth.js) en client-web/.

## Cuándo usar este skill

- Migrar componentes de `useAuthStore` (Zustand) a `useAuth` (NextAuth)
- Crear o modificar el config de NextAuth (`src/lib/auth.ts`)
- Debuggear errores 404 causados por `user.id` vacío
- Escribir tests E2E o unitarios que involucren auth
- Agregar campos custom al JWT/session (ej: `isLocal`, `phone`)

## Archivos clave

| Archivo | Qué hace |
|---------|----------|
| `src/lib/auth.ts` | Config NextAuth: providers, callbacks JWT/session, pages |
| `src/app/api/auth/[...nextauth]/route.ts` | API route handler (exporta GET, POST) |
| `src/hooks/useAuth.ts` | Hook de compatibilidad que reemplaza `useAuthStore` |
| `src/lib/api.ts` | Interceptor axios que usa `getSession()` para el token |
| `src/app/(auth)/login/page.tsx` | Login page con `signIn("credentials")` |

## Checklist obligatorio al modificar auth

### 1. Callback session DEBE propagar `token.sub`

```ts
// src/lib/auth.ts
async session({ session, token }) {
  (session as any).accessToken = token.accessToken;
  if (session.user) {
    (session.user as any).id = token.sub;  // ← SIN ESTO, user.id = ""
    (session.user as any).isLocal = token.isLocal;
    (session.user as any).phone = token.phone;
    (session.user as any).localName = token.localName;
  }
  return session;
},
```

**Por qué:** NextAuth NO propaga automáticamente campos custom. `token.sub`
viene de `user.id` retornado por `authorize()`. Sin copiarlo a `session.user.id`,
todos los endpoints que usan el ID en la URL fallan con 404.

### 2. Callback JWT DEBE copiar campos del user al token

```ts
async jwt({ token, user }) {
  if (user) {
    token.accessToken = (user as any).accessToken;
    token.isLocal = (user as any).isLocal;
    token.phone = (user as any).phone;
    token.localName = (user as any).localName;
  }
  return token;
},
```

### 3. Verificar que `user.id` no sea `""`

Antes de usar `user.id` en una URL o query:

```ts
const localId = user?.id ?? "";
if (!localId) return; // o mostrar error
```

## Migración de `useAuthStore` a `useAuth`

### Reemplazo directo

```ts
// ANTES (Zustand)
import { useAuthStore } from "@/stores/auth";
const { user, hasHydrated } = useAuthStore();

// DESPUÉS (NextAuth)
import { useAuth } from "@/hooks/useAuth";
const { user, hasHydrated } = useAuth();
```

### Interfaz del hook

```ts
{
  user: User | null;        // Mismo tipo que antes
  token: string | null;     // accessToken del JWT
  hasHydrated: boolean;     // true cuando status !== "loading"
  isLoading: boolean;       // status === "loading"
  logout: () => void;       // llama a signOut()
  updateUserProfile: (data: Record<string, unknown>) => Promise<void>;
}
```

### Buscar TODAS las referencias

Al migrar, buscar en TODOS los archivos (incluyendo tests):

```bash
grep -r "useAuthStore" src/ --include="*.ts" --include="*.tsx"
grep -r "from.*@/stores/auth" src/ --include="*.ts" --include="*.tsx"
```

Los archivos `__tests__/` también necesitan actualización.

## Mocking en tests

### Vitest (unit tests)

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

### Playwright (E2E tests)

NextAuth requiere mockear DOS endpoints. El callback devuelve `{ url }`,
NO `{ user, token, ok }`.

```ts
let signInAttempted = false;

await page.route("**/api/auth/**", async (route, request) => {
  const url = request.url();

  // 1. Mock del callback de credentials
  if (url.includes("/api/auth/callback/credentials")) {
    signInAttempted = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "http://localhost:3001/expected-redirect" }),
    });
    return;
  }

  // 2. Mock de la session (después del login)
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

**Importante:** No mockear `/api/auth/session` ANTES del login, o el layout
de auth detectará al usuario como autenticado y no renderizará el form.

## Diferencias clave con el viejo Zustand store

| Aspecto | Zustand (viejo) | NextAuth (actual) |
|---------|-----------------|-------------------|
| Storage | localStorage | HttpOnly cookie (JWT) |
| Token en cliente | `useAuthStore().token` | `useAuth().token` o `getSession()` |
| Token en API | Interceptor leía del store | Interceptor usa `await getSession()` |
| Login | `authService.login()` → `useAuthStore().login()` | `signIn("credentials")` |
| Logout | `useAuthStore().logout()` | `signOut()` |
| SSR safety | `storage.ts` wrapper | Nativo (cookies) |

## Errores comunes

### 404 en PATCH/POST con ID vacío
**Causa:** `session.user.id` no se propagó desde `token.sub`.
**Fix:** Agregar `(session.user as any).id = token.sub;` en callback session.

### "Cargando datos del local..." infinito
**Causa:** `user.id` es `""`, el `find()` nunca encuentra match.
**Fix:** Idem anterior.

### Test E2E de login no redirige
**Causa:** Solo se mockeó `/api/auth/callback/credentials` pero no `/api/auth/session`.
**Fix:** Mockear ambos endpoints (ver sección Playwright arriba).

### Tests unitarios fallan después de migrar
**Causa:** Archivos `__tests__/` todavía mockean `useAuthStore`.
**Fix:** `grep -r "useAuthStore" src/` y actualizar todos.
