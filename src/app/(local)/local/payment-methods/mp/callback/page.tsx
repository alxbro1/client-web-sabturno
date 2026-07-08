"use client";

/**
 * `/local/payment-methods/mp/callback` — destino del redirect de MercadoPago
 * tras completar el OAuth.
 *
 * Flujo:
 *   1. El local-owner hace click en "Activar MercadoPago" en
 *      `/local/payment-methods`.
 *   2. El frontend redirige a `/mercadopago/oauth/start?app_redirect_uri=...`
 *      (top-level redirect, sale de la SPA).
 *   3. El backend inicia el OAuth con MercadoPago (PKCE).
 *   4. MercadoPago redirige a `/mercadopago/oauth/callback` en el backend.
 *   5. El backend intercambia el code por tokens, persiste en el `Local`
 *      (incluyendo `mercadoPagoLiveMode: true`), y redirige a esta página.
 *   6. Esta página actualiza el auth store con `mercadoPagoLiveMode: true`
 *      y redirige a la pantalla de métodos de cobro.
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

export default function MercadoPagoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUserProfile } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Procesando conexion con MercadoPago...");

  useEffect(() => {
    const statusParam = searchParams?.get("status");
    const errorParam = searchParams?.get("error") || searchParams?.get("reason");

    if (statusParam === "success") {
      setStatus("success");
      setMessage("Tu cuenta de MercadoPago fue conectada correctamente.");
      updateUserProfile({ mercadoPagoLiveMode: true });
    } else if (statusParam === "error" || errorParam) {
      setStatus("error");
      setMessage(
        errorParam || "No se pudo completar la conexion con MercadoPago.",
      );
    } else {
      setStatus("error");
      setMessage(
        "No se recibio confirmacion de MercadoPago. Vuelve a la pantalla de metodos de cobro y reintenta si es necesario.",
      );
    }

    const timeout = window.setTimeout(() => {
      router.replace("/local/payment-methods");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [searchParams, router, updateUserProfile]);

  return (
    <section className="grid gap-6 place-items-center min-h-[60vh]">
      <div className="max-w-md w-full border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-8 text-center">
        {status === "success" ? (
          <div className="text-[#00f068]">
            <CheckCircle2 className="w-12 h-12 mx-auto" aria-hidden="true" />
            <h2 className="text-xl font-bold mt-3">MercadoPago conectado</h2>
          </div>
        ) : status === "error" ? (
          <div className="text-[#ff5678]">
            <AlertCircle className="w-12 h-12 mx-auto" aria-hidden="true" />
            <h2 className="text-xl font-bold mt-3">No se pudo conectar</h2>
          </div>
        ) : (
          <div className="text-white/70">
            <h2 className="text-xl font-bold mt-3">Procesando...</h2>
          </div>
        )}
        <p className="text-white/70 mt-3">{message}</p>
        <p className="text-white/40 text-sm mt-4">
          Seras redirigido en unos segundos.
        </p>
      </div>
    </section>
  );
}
