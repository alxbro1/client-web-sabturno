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
  accessHash: string | null,
) {
  return useQuery<PaymentResult, Error>({
    queryKey: queryKeys.paymentStatus(
      externalReference ?? "",
      taloPaymentId ?? "",
      accessHash ?? "",
    ),
    queryFn: async () => {
      if (taloPaymentId) {
        const data = await taloService.getPayment(taloPaymentId);
        return { type: "talo" as const, data };
      }

      if (externalReference) {
        const data = accessHash
          ? await bookingService.getGuestPaymentStatusByExternalReference(
            externalReference,
              accessHash,
            )
          : await bookingService.getPaymentStatusByExternalReference(
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
