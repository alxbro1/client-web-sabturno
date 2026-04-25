import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

export function RootRedirect() {
  const { token, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
        Cargando...
      </div>
    );
  }

  return <Navigate to={token ? "/home" : "/login"} replace />;
}