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
 *      en el `Local`, y responde con HTML que contiene un deep link
 *      `sabturno://talo/partner-connected?...`. Ese deep link no funciona
 *      en web.
 *   5. **Workaround**: el backend permite configurar el `app_redirect_uri`
 *      que mandamos en el `POST /talo/partners/authorize`. Si está
 *      configurado a esta ruta (`/local/payment-methods/talo/callback`),
 *      Talo redirige directamente aquí con `?status=success&localId=...&taloUserId=...`.
 *
 * Esta página muestra un mensaje de éxito/error y, tras 2s, cierra la
 * ventana (si fue abierta como popup) o redirige a la pantalla principal
 * de métodos de cobro.
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function IconCheckCircle() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-12 h-12 mx-auto"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

function IconError() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-12 h-12 mx-auto"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}

export default function TaloCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Procesando conexion con Talo...");

  useEffect(() => {
    const statusParam = searchParams?.get("status");
    const errorParam = searchParams?.get("error");

    if (statusParam === "success") {
      setStatus("success");
      setMessage("Tu cuenta de Talo fue conectada correctamente.");
    } else if (statusParam === "error" || errorParam) {
      setStatus("error");
      setMessage(
        searchParams?.get("message") ||
          errorParam ||
          "No se pudo completar la conexion con Talo.",
      );
    } else {
      // Sin query params reconocibles: probablemente el callback del backend
      // no fue redirigido aquí (sigue sirviendo el deep link `sabturno://`).
      // Mostramos un mensaje neutro y dejamos que el local-owner vuelva
      // manualmente a la pantalla principal.
      setStatus("error");
      setMessage(
        "No se recibio confirmacion de Talo. Vuelve a la pantalla de metodos de cobro y reintenta si es necesario.",
      );
    }

    const timeout = window.setTimeout(() => {
      // Si esta página se abrió como popup, cerrarla; si no, navegar.
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
  }, [searchParams, router]);

  return (
    <section className="grid gap-6 place-items-center min-h-[60vh]">
      <div className="max-w-md w-full border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-8 text-center">
        {status === "success" ? (
          <div className="text-[#00f068]">
            <IconCheckCircle />
            <h2 className="text-xl font-bold mt-3">Talo conectado</h2>
          </div>
        ) : status === "error" ? (
          <div className="text-[#ff5678]">
            <IconError />
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
