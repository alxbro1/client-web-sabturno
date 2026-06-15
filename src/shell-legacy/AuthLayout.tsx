import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

export function AuthLayout() {
  const { token, user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
        Cargando...
      </div>
    );
  }

  if (token && !user?.isLocal) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen grid place-items-center p-8 max-sm:p-4 bg-[radial-gradient(circle_at_top,rgba(0,240,104,0.05),transparent_38%)]">
      <Outlet />
    </div>
  );
}