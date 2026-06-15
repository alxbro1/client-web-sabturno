import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking";
import { taloService, type TaloPayment } from "@/services/talo";
import { queryKeys } from "@/lib/queryKeys";
import type { PaymentStatusResponse } from "@/lib/types/booking";

type PaymentResult =
  | { type: "mercadopago"; data: PaymentStatusResponse }
  | { type: "talo"; data: TaloPayment }
  | null;

export function usePaymentStatusQuery(
  externalReference: string | null,
  taloPaymentId: string | null,
) {
  return useQuery<PaymentResult, Error>({
    queryKey: queryKeys.paymentStatus(
      externalReference ?? "",
      taloPaymentId ?? "",
    ),
    queryFn: async () => {
      if (taloPaymentId) {
        const data = await taloService.getPayment(taloPaymentId);
        return { type: "talo" as const, data };
      }

      if (externalReference) {
        const data =
          await bookingService.getPaymentStatusByExternalReference(
            externalReference,
          );
        return { type: "mercadopago" as const, data };
      }

      return null;
    },
    enabled: !!externalReference || !!taloPaymentId,
    staleTime: 10 * 1000,
  });
}
