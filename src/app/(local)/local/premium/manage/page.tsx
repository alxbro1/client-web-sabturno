"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  CreditCard,
  CalendarDays,
  RefreshCw,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/Button";
import {
  PlanBadge,
  TrialCountdown,
  CashUsageBar,
  CancelSubscriptionDialog,
} from "@/components/premium";
import { usePremiumStatusQuery } from "@/hooks/queries/usePremiumStatusQuery";
import { usePremiumPlansQuery, FALLBACK_PLANS } from "@/hooks/queries/usePremiumPlansQuery";
import { premiumService } from "@/services/premium";
import { useAuthStore } from "@/stores/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function PremiumManagePage() {
  const router = useRouter();
  const { hasHydrated, user } = useAuthStore();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const { data: status, isLoading: statusLoading, refetch } = usePremiumStatusQuery();
  const { data: plans } = usePremiumPlansQuery();

  const displayPlans = plans ?? FALLBACK_PLANS;

  async function handleCancelSubscription() {
    try {
      const result = await premiumService.cancelSubscription();
      if (result.success) {
        toast.success(
          result.message || "Renovación automática cancelada correctamente",
        );
        refetch();
      }
    } catch (error) {
      console.error("Error al cancelar:", error);
      toast.error("No se pudo cancelar la suscripción. Intentá de nuevo.");
    }
  }

  async function handleChangePlan(newPlanId: string) {
    setIsChangingPlan(true);
    try {
      const result = await premiumService.changePlan({ newPlanId });
      if (result.success) {
        toast.success(result.message || "Plan cambiado correctamente");
        refetch();
      }
    } catch (error) {
      console.error("Error al cambiar plan:", error);
      toast.error("No se pudo cambiar el plan. Intentá de nuevo.");
    } finally {
      setIsChangingPlan(false);
    }
  }

  if (!hasHydrated || statusLoading) {
    return (
      <div className="min-h-[400px] grid place-items-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user?.isLocal) {
    return (
      <div className="min-h-[400px] grid place-items-center text-center">
        <p className="text-muted-foreground">
          Solo los propietarios de locales pueden gestionar suscripciones.
        </p>
      </div>
    );
  }

  if (!status || status.tier === "basic") {
    return (
      <section className="grid gap-6 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            No tenés una suscripción activa
          </h1>
          <p className="text-muted-foreground mb-6">
            Elegí un plan para desbloquear todas las funcionalidades.
          </p>
          <Link href="/local/premium">
            <Button>Ver planes</Button>
          </Link>
        </div>
      </section>
    );
  }

  const availableUpgrades = displayPlans.filter(
    (p) =>
      p.tier !== "basic" &&
      p.tier !== status.tier &&
      (p.tier === "enterprise" || (p.tier === "pro" && status.tier === "basic")),
  );

  const formattedNextBilling = status.nextBillingDate
    ? new Date(status.nextBillingDate).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section className="grid gap-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/local/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </div>

      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
          Suscripción
        </p>
        <h1 className="text-2xl font-bold text-foreground">
          Gestionar suscripción
        </h1>
      </header>

      {/* Estado actual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plan actual</CardTitle>
            <PlanBadge tier={status.tier} />
          </div>
          <CardDescription>{status.planName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.status === "trial" && status.trialEndDate && (
            <TrialCountdown trialEndDate={status.trialEndDate} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
              <CreditCard className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Facturación</p>
                <p className="font-medium text-foreground">
                  {status.interval === "monthly" ? "Mensual" : "Anual"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
              <CalendarDays className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Próximo cobro</p>
                <p className="font-medium text-foreground">
                  {formattedNextBilling ?? "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
              <RefreshCw className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Auto-renovación</p>
                <p className="font-medium text-foreground">
                  {status.autoRenew ? "Activa" : "Desactivada"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
              <XCircle className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-medium text-foreground">
                  {status.status === "active"
                    ? "Activo"
                    : status.status === "trial"
                      ? "En trial"
                      : status.status === "cancelled"
                        ? "Cancelado"
                        : "Expirado"}
                </p>
              </div>
            </div>
          </div>

          {status.tier === "pro" && (
            <CashUsageBar
              used={status.cashTurnsUsed}
              limit={500}
            />
          )}
        </CardContent>
      </Card>

      {/* Cambiar plan */}
      {availableUpgrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cambiar plan</CardTitle>
            <CardDescription>
              Upgradeá tu plan para desbloquear más funcionalidades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {availableUpgrades.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.monthlyPrice > 0
                        ? `$${plan.monthlyPrice.toLocaleString("es-AR")}/mes`
                        : "Gratis"}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleChangePlan(plan.id)}
                    disabled={isChangingPlan}
                  >
                    {isChangingPlan ? "Cambiando..." : "Cambiar"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelar */}
      {status.autoRenew && (
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">
                  Cancelar renovación automática
                </p>
                <p className="text-sm text-muted-foreground">
                  Tu plan seguirá activo hasta el fin del período pagado.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelSubscription}
        planName={status.planName}
        nextBillingDate={status.nextBillingDate}
      />
    </section>
  );
}
