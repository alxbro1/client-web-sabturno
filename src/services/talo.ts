import { apiService } from "@/lib/api";
import type { AxiosResponse } from "axios";

/**
 * Shape de un pago Talo (CVU/alias, expiración, refunds, etc.).
 * Compatible con `talo.service.ts` de la app móvil
 * (`app/src/features/user/services/talo.service.ts`).
 */
export interface TaloPayment {
  id: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount: number;
  currency: string;
  cbu?: string;
  alias?: string;
  aliasCbu?: string;
  expirationTimestamp?: string;
  createdAt: string;
}

/**
 * Respuesta de `GET /talo/status/:localId`.
 *
 * Incluye el flag `payWithTalo` (toggle persistido en el `Local`) además del
 * `connected`/`accountStatus` (estado de la cuenta Talo partner).
 *
 * - `connected === false` → la cuenta Talo nunca se vinculó.
 * - `connected === true` y `accountStatus === "ACTIVE"` → operativa.
 * - `connected === true` y `accountStatus` otro → esperando webhook de Talo.
 */
export interface TaloStatusResponse {
  connected: boolean;
  payWithTalo?: boolean;
  accountStatus?: string | null;
  taloUserId?: string;
}

/**
 * Respuesta de `GET /talo/partners/account/:localId` (sync forzado).
 * El backend consulta a Talo y refresca `taloAccountStatus` en la DB.
 */
export interface TaloSyncAccountResponse {
  accountStatus: string;
  taloUserId?: string;
  aliasPrefix?: string;
}

/**
 * Wrapper sobre `apiService` para los endpoints de Talo.
 *
 * El backend (`backend/src/talo/`) expone:
 * - `GET  /talo/status/:localId`                 (público, ver `talo.controller.ts`)
 * - `POST /talo/partners/authorize`              (público; genera `authorization_url`)
 * - `GET  /talo/partners/account/:localId`       (público; sincroniza con Talo)
 * - `GET  /talo/payments/:paymentId`             (detalle)
 * - `GET  /talo/payments?page&limit&status`      (listado paginado)
 *
 * Los métodos faltantes para paridad con el mobile se agregan a continuación.
 */
export const taloService = {
  /** `GET /talo/status/:localId` — estado actual de la cuenta Talo del local. */
  getStatus: async (localId: string): Promise<TaloStatusResponse> => {
    const response: AxiosResponse<TaloStatusResponse> = await apiService.get(`/talo/status/${localId}`);
    return response.data;
  },

  /**
   * `POST /talo/partners/authorize` — genera la URL de OAuth de Talo.
   *
   * En la app móvil este método también lee el JWT del store y lo manda en
   * el header `Authorization: Bearer <jwt>`. En la web la sesión viaja por
   * cookies (el `apiClient` ya tiene `withCredentials: true`), así que no
   * hace falta pasar el token manualmente.
   *
   * @param localId         ID del local que solicita la autorización.
   * @param appRedirectUri  URL HTTPS de la SPA a la que Talo debe redirigir
   *                        tras la autorización. Debe estar whitelisteada en
   *                        el backend.
   */
  getAuthorizeUrl: async (localId: string, appRedirectUri: string): Promise<string> => {
    const response = await apiService.post<{ authorization_url: string }>(
      "/talo/partners/authorize",
      { localId, app_redirect_uri: appRedirectUri },
    );
    return response.data.authorization_url;
  },

  /**
   * `GET /talo/partners/account/:localId` — fuerza la sincronización del
   * estado de la cuenta Talo desde los servidores de Talo.
   *
   * Útil después del callback OAuth cuando `accountStatus` quedó en
   * `PENDING` (la activación real llega por webhook de Talo).
   */
  syncAccountStatus: async (localId: string): Promise<TaloSyncAccountResponse> => {
    const response = await apiService.get<TaloSyncAccountResponse>(
      `/talo/partners/account/${localId}`,
    );
    return response.data;
  },

  /** `GET /talo/payments/:paymentId` — detalle de un pago. */
  getPayment: async (paymentId: string): Promise<TaloPayment> => {
    const response: AxiosResponse<TaloPayment> = await apiService.get(`/talo/payments/${paymentId}`);
    return response.data;
  },

  /**
   * `GET /talo/payments` — listado paginado de pagos del local.
   * (En esta pantalla de métodos de cobro no se usa; queda para la sección
   * "Historial de pagos" del local-owner.)
   */
  getMyPayments: async (params?: { page?: number; limit?: number }): Promise<{
    items: TaloPayment[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiService.get("/talo/payments", { params });
    return response.data as { items: TaloPayment[]; total: number; page: number; totalPages: number };
  },
};
