/**
 * Barrel del feature `payment-methods`.
 *
 * Sigue el patrón de `features/appointment-timeline/index.ts` y
 * `features/local/index.ts`: re-exporta todo lo público del feature para
 * que los consumidores importen desde una sola ruta.
 *
 *   import { usePaymentMethods, PaymentMethodCard } from "@/features/payment-methods";
 *
 * Mantener sincronizado con los sub-paquetes (components/, hooks/, services/, types/).
 */
export * from "./types/payment-methods.types";
export * from "./components";
export * from "./hooks";
