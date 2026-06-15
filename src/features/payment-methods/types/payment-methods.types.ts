/**
 * Tipos del feature `payment-methods`.
 *
 * Modelan los flags configurables que un local-owner puede activar/desactivar
 * para aceptar pagos en su negocio. Estos flags viven en el modelo `Local`
 * (Prisma) y se persisten vía `PATCH /local/:id`.
 *
 * El subconjunto de flags que el cliente manipula desde esta pantalla es:
 * - `mercadoPagoLiveMode` → acepta pagos con MercadoPago (Checkout Pro).
 * - `payWithTalo`         → acepta pagos con Talo (transferencias bancarias).
 * - `payWithReservation`  → permite cobrar una seña (parcial) al reservar.
 * - `payWithCashInFront`  → acepta efectivo en el local al momento del turno.
 *
 * El campo `reservationPercentage` (10-60) acompaña a `payWithReservation`
 * y representa el porcentaje del servicio que se cobra como seña.
 *
 * La etiqueta `MethodKey` se usa en componentes y hooks para hacer toggle
 * tipado del flag correspondiente.
 */
export type MethodKey =
  | "mercadoPagoLiveMode"
  | "payWithTalo"
  | "payWithReservation"
  | "payWithCashInFront";

/**
 * Snapshot editable de los métodos de cobro en el form de la pantalla.
 * Lo que el local-owner ve y modifica antes de "Guardar cambios".
 */
export interface PaymentMethodsFormState {
  mercadoPagoLiveMode: boolean;
  payWithTalo: boolean;
  payWithReservation: boolean;
  payWithCashInFront: boolean;
  /** Porcentaje de reserva (10-60). Vacío ("") cuando reserva está apagada. */
  reservationPercentage: string;
}

/**
 * Payload final que se envía al backend en `PATCH /local/:id`.
 * Solo incluye `reservationPercentage` cuando `payWithReservation` es true;
 * si no, el backend lo limpia a `null` (ver `local.service.ts` backend).
 */
export interface UpdatePaymentMethodsPayload {
  mercadoPagoLiveMode: boolean;
  payWithTalo: boolean;
  payWithReservation: boolean;
  payWithCashInFront: boolean;
  reservationPercentage: number | null;
}
