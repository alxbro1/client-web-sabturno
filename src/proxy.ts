import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/home", "/appointments", "/profile", "/payments", "/local"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verified"];

interface SessionPayload {
  user?: {
    isLocal?: boolean;
  };
}

function readIsLocalFromCookie(rawCookie: string | undefined): boolean | null {
  if (!rawCookie) return null;
  try {
    const parsed = JSON.parse(rawCookie) as SessionPayload;
    return parsed.user?.isLocal ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("sabturno_session");
  const isAuthenticated = !!sessionCookie;
  const isLocal = readIsLocalFromCookie(sessionCookie?.value);

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    // Redirigir al destino correcto segun el rol. Un local-owner no
    // deberia terminar en /home (cliente) ni un cliente en
    // /local/dashboard. Si no podemos parsear la cookie, mandamos a /home
    // como fallback seguro.
    const target =
      isLocal === true
        ? "/local/dashboard"
        : isLocal === false
          ? "/home"
          : "/home";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/appointments/:path*",
    "/profile/:path*",
    "/payments/:path*",
    "/local/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verified",
  ],
};
