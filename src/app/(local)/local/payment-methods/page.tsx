"use client";

/**
 * `/local/payment-methods` — pantalla de configuración de métodos de cobro
 * del local-owner.
 *
 * Equivalente web de `app/src/features/profile/screens/ReceiptMethods.tsx`.
 *
 * Permite:
 *   - Toggle de MercadoPago (dispara OAuth top-level).
 *   - Toggle de Talo (dispara OAuth en popup).
 *   - Toggle de Reserva (input % 10-60 cuando activo).
 *   - Toggle de Efectivo.
 *   - Botón "Guardar cambios" → `PATCH /local/:id`.
 *
 * La orquestación de estado + OAuth + save vive en el hook
 * `usePaymentMethods` (feature `payment-methods`).
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import {
  PaymentMethodCard,
  TaloStatusIndicator,
  usePaymentMethods,
} from "@/features/payment-methods";
import { useAuthStore } from "@/stores/auth";
import iconMercadoPago from "@/assets/payment-methods/mercado_pago.png";
import iconTalo from "@/assets/payment-methods/talo.png";
import iconReserved from "@/assets/payment-methods/reserved.png";
import iconCash from "@/assets/payment-methods/cash-in-front.png";

function MethodIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden="true"
      className="h-10 w-10 object-contain"
    />
  );
}

export default function PaymentMethodsPage() {
  const { user, hasHydrated } = useAuthStore();
  const pm = usePaymentMethods();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-clear del banner de éxito después de 3s (paridad con
  // `local/profile/page.tsx:89`).
  useEffect(() => {
    if (!saveSuccess) return;
    const timeout = window.setTimeout(() => setSaveSuccess(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [saveSuccess]);

  if (!hasHydrated) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[140px] grid place-items-center text-center text-white/50">
        Inicia sesion para configurar tus metodos de cobro.
      </div>
    );
  }

  async function handleSave() {
    const ok = await pm.save();
    if (ok) setSaveSuccess(true);
  }

  const taloLabel = !pm.taloStatus?.connected
    ? "Conectar Talo (Transferencias automaticas)"
    : pm.taloStatus.accountStatus === "ACTIVE"
      ? "Talo activo (Transferencias automaticas)"
      : `Talo ${pm.taloStatus.accountStatus ?? "PENDING"} (Transferencias automaticas)`;

  return (
    <section className="grid gap-6">
      <header>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
          Cobros
        </p>
        <h2 className="text-2xl font-bold text-white">Metodos de cobro</h2>
        <p className="text-white/60 mt-1">
          Configura MercadoPago, Talo, reserva parcial y efectivo. Los clientes
          solo veran los metodos que tengas activos.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <PaymentMethodCard
          title="Mercado Pago (Tarjetas y mas)"
          description="Conecta tu cuenta para cobrar con tarjeta, debito y otros medios."
          selected={pm.form.mercadoPagoLiveMode}
          onClick={() => pm.toggle("mercadoPagoLiveMode")}
          icon={
            <MethodIcon src={iconMercadoPago.src} alt="Mercado Pago" />
          }
        />

        <PaymentMethodCard
          title={taloLabel}
          description="Transferencias bancarias automaticas. Requiere activar la cuenta."
          selected={pm.form.payWithTalo}
          onClick={() => pm.toggle("payWithTalo")}
          icon={<MethodIcon src={iconTalo.src} alt="Talo" />}
          rightContent={
            <TaloStatusIndicator
              loading={pm.isTaloLoading}
              connected={!!pm.taloStatus?.connected}
              accountStatus={pm.taloStatus?.accountStatus ?? null}
            />
          }
        />

        <PaymentMethodCard
          title="Reserva parcial"
          description="Cobra una senia al reservar y el resto en el local."
          selected={pm.form.payWithReservation}
          onClick={() => pm.toggle("payWithReservation")}
          icon={<MethodIcon src={iconReserved.src} alt="Reserva" />}
        />

        <PaymentMethodCard
          title="Efectivo en el local"
          description="El cliente paga presencialmente al momento del turno."
          selected={pm.form.payWithCashInFront}
          onClick={() => pm.toggle("payWithCashInFront")}
          icon={<MethodIcon src={iconCash.src} alt="Efectivo" />}
        />
      </div>

      {pm.form.payWithReservation ? (
        <div className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-6 space-y-3">
          <div>
            <label
              htmlFor="reservation-percentage"
              className="block text-sm font-semibold text-white mb-1"
            >
              Porcentaje de reserva (10% - 60%)
            </label>
            <p className="text-white/60 text-sm">
              Define cuanto se cobra al reservar. El resto se paga en el local.
            </p>
          </div>
          <input
            id="reservation-percentage"
            type="number"
            inputMode="numeric"
            min={10}
            max={60}
            step={1}
            value={pm.form.reservationPercentage}
            onChange={(e) => pm.setReservationPercentage(e.target.value)}
            placeholder="Ej: 20"
            className="w-32 px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50 focus:ring-1 focus:ring-[#00f068]/30 transition-all"
          />
        </div>
      ) : null}

      {pm.error ? (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {pm.error}
        </div>
      ) : null}

      {saveSuccess ? (
        <div className="rounded-2xl border border-[#00f068]/40 bg-[rgba(0,240,104,0.1)] px-4 py-[0.95rem] text-[#00f068] flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Cambios guardados exitosamente
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={pm.isSaving}
          aria-label="Guardar cambios"
        >
          {pm.isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </section>
  );
}
