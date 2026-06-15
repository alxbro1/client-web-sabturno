"use client";

/**
 * `TaloStatusIndicator` — dot + spinner que refleja el estado de la cuenta
 * Talo del local.
 *
 * Equivalente web del bloque `taloStatus` en `MethodItem` del mobile
 * (`ReceiptMethods.tsx:253-272`).
 *
 *   - Verde  → `connected && accountStatus === "ACTIVE"`.
 *   - Amarillo → `connected && accountStatus !== "ACTIVE"` (PENDING/SUSPENDED/REJECTED).
 *   - Gris    → `!connected` (la cuenta nunca se vinculó).
 *   - Spinner → mientras `loading` (carga inicial o sync).
 */
interface TaloStatusIndicatorProps {
  loading: boolean;
  connected: boolean;
  accountStatus: string | null;
}

export function TaloStatusIndicator({
  loading,
  connected,
  accountStatus,
}: TaloStatusIndicatorProps) {
  if (loading) {
    return (
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#00f068] border-t-transparent animate-spin"
        aria-label="Cargando estado de Talo"
      />
    );
  }

  if (!connected) {
    return (
      <span
        className="inline-block h-2.5 w-2.5 rounded-full bg-white/30"
        aria-label="Talo no vinculado"
      />
    );
  }

  const isActive = accountStatus === "ACTIVE";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        isActive ? "bg-green-500" : "bg-yellow-500"
      }`}
      aria-label={
        isActive
          ? "Talo activo"
          : `Talo en estado ${accountStatus ?? "desconocido"}`
      }
    />
  );
}
