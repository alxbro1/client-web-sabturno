import { apiService } from "@/lib/api";

export type WhatsappTransactionType =
  | "WELCOME_GIFT"
  | "CREDIT_PURCHASE"
  | "POSTPAID_SETTLEMENT"
  | "USAGE_DEBIT"
  | "FAILED_REFUND"
  | "MANUAL_ADJUSTMENT";

export type WhatsappOrderKind = "CREDIT_PACK" | "POSTPAID_SETTLEMENT";

export type WhatsappOrderStatus =
  | "PENDING"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export interface WhatsappPaymentOrderSummary {
  id: string;
  localId: string;
  kind: WhatsappOrderKind;
  status: WhatsappOrderStatus;
  periodYearMonth: string | null;
  creditsCount: number;
  unitPriceArs: number;
  totalAmountArs: number;
  mercadopagoPreferenceId: string | null;
  mercadopagoPaymentId: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

export interface WhatsappCreditTransactionItem {
  id: string;
  localId: string;
  type: WhatsappTransactionType;
  creditsDelta: number;
  balanceAfter: number;
  unitPriceArs: number;
  amountArs: number;
  description: string | null;
  notificationId: number | null;
  orderId: string | null;
  createdAt: string | null;
}

export interface WhatsappWalletSummary {
  unitPriceArs: number;
  creditsBalance: number;
  prepaidCredits: number;
  postpaidUsed: number;
  postpaidAmountArs: number;
  totalPurchasedArs: number;
  postpaidUnlockThresholdArs: number;
  postpaidUnlocked: boolean;
  remainingToUnlockPostpaidArs: number;
  postpaidLimit: number;
  billingBlocked: boolean;
  currentMonthSentCount: number;
  pendingInvoice: WhatsappPaymentOrderSummary | null;
  recentTransactions: WhatsappCreditTransactionItem[];
}

export interface WhatsappCheckoutResponse {
  orderId: string;
  preferenceId: string;
  checkoutUrl: string;
  creditsCount: number;
  unitPriceArs: number;
  totalAmountArs: number;
}

export interface ReconcileWhatsappOrderResponse {
  reconciled: boolean;
  mpStatus?: string;
  status?: WhatsappOrderStatus;
  alreadyCompleted?: boolean;
  order: WhatsappPaymentOrderSummary;
}

export const whatsappBillingService = {
  async getWallet(): Promise<WhatsappWalletSummary> {
    const response = await apiService.get<WhatsappWalletSummary>(
      "/whatsapp/billing/wallet",
    );
    return response.data;
  },

  async createCreditPackCheckout(
    creditsCount: number,
  ): Promise<WhatsappCheckoutResponse> {
    const response = await apiService.post<WhatsappCheckoutResponse>(
      "/whatsapp/billing/checkout/credits",
      { creditsCount },
    );
    return response.data;
  },

  async createPostpaidSettlementCheckout(): Promise<WhatsappCheckoutResponse> {
    const response = await apiService.post<WhatsappCheckoutResponse>(
      "/whatsapp/billing/checkout/settle",
      {},
    );
    return response.data;
  },

  async reconcileOrder(params: {
    orderId: string;
    paymentId?: string;
  }): Promise<ReconcileWhatsappOrderResponse> {
    const response = await apiService.post<ReconcileWhatsappOrderResponse>(
      "/whatsapp/billing/reconcile",
      params,
    );
    return response.data;
  },
};
