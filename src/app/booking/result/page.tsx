"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Hourglass } from "lucide-react";
import { Button } from "@/components/Button";
import TaloPaymentInfo from "@/components/TaloPaymentInfo";
import { useBookingStore } from "@/stores/booking";

type ResultStatus = "success" | "error";

export default function AppointmentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taloPaymentData = useBookingStore((s) => s.taloPaymentData);

  const status = (searchParams.get("status") || "success") as ResultStatus;
  const message = searchParams.get("message") || "";
  const result = searchParams.get("result");
  const paymentMethod = searchParams.get("paymentMethod");
  const paymentId = searchParams.get("paymentId");

  useEffect(() => {
    if (
      !["success", "error"].includes(status) &&
      !(result === "success" && paymentMethod === "talo")
    ) {
      router.replace("/home");
    }
  }, [status, router, result, paymentMethod]);

  if (
    result === "success" &&
    paymentMethod === "talo" &&
    taloPaymentData
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md grid gap-6 text-center">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-full" />
              <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center text-5xl">
                <Hourglass className="size-12 text-amber-400" />
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-2">
              Turno Reservado
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tu turno esta reservado. Completa el pago para confirmar.
            </p>
          </div>

          <TaloPaymentInfo
            paymentId={paymentId!}
            amount={taloPaymentData.amount}
            currency={taloPaymentData.currency}
            cbu={taloPaymentData.cbu}
            alias={taloPaymentData.alias}
            aliasCbu={taloPaymentData.aliasCbu}
            expirationTimestamp={taloPaymentData.expirationTimestamp}
          />

          <Button
            onClick={() =>
              router.replace(
                `/booking/payment-status?taloPaymentId=${paymentId}`,
              )
            }
            variant="primary"
            className="mt-4"
          >
            Verificar estado del pago
          </Button>

          <p className="text-xs text-muted-foreground">
            No necesitas hacer nada mas. Te notificaremos cuando el pago sea
            confirmado.
          </p>
        </div>
      </div>
    );
  }

  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md grid gap-6 text-center">
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full" />
              <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center">
                <Check className="size-12 text-primary" />
              </div>
            </div>
          ) : (
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-full" />
              <div className="absolute inset-0 border-2 border-destructive/30 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center">
                <X className="size-12 text-destructive" />
              </div>
            </div>
          )}
        </div>

        <div>
          <h1
            className={`text-3xl font-bold mb-2 ${isSuccess ? "text-primary" : "text-destructive"}`}
          >
            {isSuccess ? "Reserva Exitosa!" : "Reserva No Completada"}
          </h1>
        </div>

        <div>
          {isSuccess && message.includes("http") ? (
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              {message.split(/\n|\\n/).map((line, i) => {
                const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                  return (
                    <div key={i}>
                      <span>Accede a tu turno aqui: </span>
                      <a
                        href={urlMatch[1]}
                        className="text-primary underline break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {urlMatch[1]}
                      </a>
                    </div>
                  );
                }
                return <div key={i}>{line}</div>;
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {message ||
                (isSuccess
                  ? "Puedes verlo en tu lista de citas."
                  : "No pudimos completar tu reserva. Intenta nuevamente o contacta con soporte.")}
            </p>
          )}
        </div>

        <Button
          onClick={() => router.replace("/home")}
          variant="primary"
          className="mt-4"
        >
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
}
