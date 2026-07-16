"use client";

/**
 * `/local/payment-methods/talo/callback` — destino del redirect de Talo
 * tras la autorización del partner.
 *
 * Flujo:
 *   1. El local-owner hace click en "Activar Talo" en `/local/payment-methods`.
 *   2. Se abre un popup a `https://app-api.sabturno.com/talo/partners/authorize?...`
 *      (gestionado por el backend).
 *   3. Talo Pay autentica al usuario y redirige al callback del backend
 *      `https://app-api.sabturno.com/talo/partners/callback?code=...&referred_user_id=...`.
 *   4. El backend intercambia el `code` por el `taloPartnerToken`, persiste
 *      en el `Local` (incluyendo `payWithTalo: true`), y responde con HTML
 *      que contiene un redirect a esta página SPA.
 *   5. Esta página invalida el query de `Local` y tras 2.5s cierra el popup
 *      (recargando la ventana padre para que refleje el cambio). La pantalla
 *      de métodos de cobro usa `useLocalQuery` (no la session) como source
 *      of truth, así que el toggle se actualiza al re-fetchar.
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";

export default function TaloCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Procesando conexion con Talo...");

  useEffect(() => {
    const statusParam = searchParams?.get("status");
    const errorParam = searchParams?.get("error");

    if (statusParam === "success") {
      setStatus("success");
      setMessage("Tu cuenta de Talo fue conectada correctamente.");
      // El backend ya persistió `payWithTalo: true` en el `Local`. Marcamos
      // el query como stale para que la próxima lectura re-fetchee el
      // `Local` actualizado.
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.local(user.id) });
      }
    } else if (statusParam === "error" || errorParam) {
      setStatus("error");
      setMessage(
        searchParams?.get("message") ||
          errorParam ||
          "No se pudo completar la conexion con Talo.",
      );
    } else {
      setStatus("error");
      setMessage(
        "No se recibio confirmacion de Talo. Vuelve a la pantalla de metodos de cobro y reintenta si es necesario.",
      );
    }

    const timeout = window.setTimeout(() => {
      if (window.opener) {
        try {
          window.opener.location.reload();
        } catch {
          /* cross-origin: ignorar */
        }
        window.close();
      } else {
        router.replace("/local/payment-methods");
      }
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [searchParams, router, queryClient, user?.id]);

  return (
    <section className="grid gap-6 place-items-center min-h-[60vh]">
      <div className="max-w-md w-full border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-8 text-center">
        {status === "success" ? (
          <div className="text-[#00f068]">
            <CheckCircle2 className="w-12 h-12 mx-auto" aria-hidden="true" />
            <h2 className="text-xl font-bold mt-3">Talo conectado</h2>
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
          {window.opener
            ? "Esta ventana se cerrara automaticamente."
            : "Seras redirigido en unos segundos."}
        </p>
      </div>
    </section>
  );
}
