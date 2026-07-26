"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FlaskConical,
  Gift,
  Info,
  MailCheck,
  Pause,
  Play,
  Save,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/ui/card";
import { FeatureLockedOverlay } from "@/components/premium";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumStatusQuery } from "@/hooks/queries/usePremiumStatusQuery";
import { useServicesQuery } from "@/hooks/queries/useServicesQuery";
import { queryKeys } from "@/lib/queryKeys";
import { formatLocalDate } from "@/lib/utils/date";
import { loyaltyService } from "@/services/loyalty";
import { timelineService } from "@/services/timeline";
import type { LoyaltyProgramPayload, LoyaltyRewardType } from "@/lib/types/loyalty";

const rewardOptions: Array<{ value: LoyaltyRewardType; label: string }> = [
  { value: "FREE_SERVICE", label: "Servicio gratis" },
  { value: "PERCENTAGE_DISCOUNT", label: "Descuento %" },
  { value: "FIXED_DISCOUNT", label: "Descuento fijo" },
];

export default function LocalLoyaltyPage() {
  const { user } = useAuth();
  const localId = user?.id || "";
  const queryClient = useQueryClient();
  const { data: premiumStatus } = usePremiumStatusQuery();
  const { data: services = [] } = useServicesQuery(localId);
  const isLocked = premiumStatus?.tier !== "enterprise";
  const isDevelopment = process.env.NODE_ENV === "development";

  const { data: summary, isLoading } = useQuery({
    queryKey: queryKeys.loyaltyOwner(localId),
    queryFn: () => loyaltyService.getOwnerSummary(localId),
    enabled: !!localId && !isLocked,
  });

  const { data: cards = [] } = useQuery({
    queryKey: queryKeys.loyaltyLocalCards(localId),
    queryFn: () => loyaltyService.getLocalCards(localId),
    enabled: !!localId && !isLocked,
  });
  const { data: developmentAppointments } = useQuery({
    queryKey: queryKeys.loyaltyDevelopmentAppointments(localId),
    queryFn: () =>
      timelineService.getAppointmentsByEntity(localId, {
        status: ["CONFIRMED"],
        limit: 50,
      }),
    enabled: isDevelopment && !!localId && !isLocked,
  });
  const [adjustingCardId, setAdjustingCardId] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [developmentAppointmentId, setDevelopmentAppointmentId] = useState("");
  const [developmentConfirmed, setDevelopmentConfirmed] = useState(false);

  const latestRevision = summary?.program?.revisions?.[0];
  const [rewardType, setRewardType] = useState<LoyaltyRewardType>(
    latestRevision?.rewardType || "FREE_SERVICE",
  );

  const defaultValues = useMemo(() => ({
    name: summary?.program?.name || "Tarjeta de fidelidad",
    stampsRequired: latestRevision?.stampsRequired || 6,
    rewardValue: Number(latestRevision?.rewardValue || 0),
    rewardServiceId: latestRevision?.rewardServiceId || services[0]?.id,
    cardExpiresAfterDays: latestRevision?.cardExpiresAfterDays || 365,
    rewardExpiresAfterDays: latestRevision?.rewardExpiresAfterDays || 90,
  }), [latestRevision, services, summary?.program?.name]);

  const saveMutation = useMutation({
    mutationFn: (payload: LoyaltyProgramPayload) =>
      summary?.program
        ? loyaltyService.updateProgram(localId, payload)
        : loyaltyService.saveProgram(localId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyOwner(localId) });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "PAUSED") =>
      loyaltyService.updateProgramStatus(localId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyOwner(localId) });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({
      cardId,
      stamps,
      reason,
    }: {
      cardId: string;
      stamps: number;
      reason: string;
    }) => loyaltyService.adjustCard(localId, cardId, stamps, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyOwner(localId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyLocalCards(localId) });
      setAdjustingCardId(null);
      setAdjustment("");
      setAdjustmentReason("");
    },
  });

  const developmentCompletionMutation = useMutation({
    mutationFn: (appointmentId: number) =>
      loyaltyService.completeAppointmentForDevelopment(localId, appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyOwner(localId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyLocalCards(localId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loyaltyDevelopmentAppointments(localId),
      });
      setDevelopmentAppointmentId("");
      setDevelopmentConfirmed(false);
    },
  });

  const selectedDevelopmentAppointment = developmentAppointments?.items.find(
    (appointment) => String(appointment.id) === developmentAppointmentId,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: LoyaltyProgramPayload = {
      name: String(form.get("name") || "Tarjeta de fidelidad"),
      stampsRequired: Number(form.get("stampsRequired") || 6),
      stampsPerAppointment: 1,
      rewardType,
      rewardValue:
        rewardType === "FREE_SERVICE" ? undefined : Number(form.get("rewardValue") || 0),
      rewardServiceId:
        rewardType === "FREE_SERVICE" ? Number(form.get("rewardServiceId")) : undefined,
      cardExpiresAfterDays: Number(form.get("cardExpiresAfterDays") || 365),
      rewardExpiresAfterDays: Number(form.get("rewardExpiresAfterDays") || 90),
      status: "ACTIVE",
    };
    saveMutation.mutate(payload);
  }

  return (
    <section className="relative grid gap-6">
      <header className="flex items-start justify-between gap-4 max-sm:flex-col">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Enterprise
          </p>
          <h1 className="text-2xl font-bold text-foreground">Fidelidad</h1>
          <p className="text-muted-foreground">
            Configura sellos, vencimientos y beneficios para tus clientes.
          </p>
        </div>
        {summary?.program ? (
          <Button
            variant="secondary"
            onClick={() =>
              statusMutation.mutate(summary.program?.status === "ACTIVE" ? "PAUSED" : "ACTIVE")
            }
          >
            {summary.program.status === "ACTIVE" ? <Pause /> : <Play />}
            {summary.program.status === "ACTIVE" ? "Pausar" : "Activar"}
          </Button>
        ) : null}
      </header>

      {isLocked ? (
        <div className="relative min-h-[360px]">
          <FeatureLockedOverlay
            featureName="Fidelidad"
            requiredTier="enterprise"
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Tarjetas</p>
              <strong className="text-2xl text-foreground">
                {summary?.metrics.cardsCount || 0}
              </strong>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Recompensas disponibles</p>
              <strong className="text-2xl text-foreground">
                {summary?.metrics.availableRewards || 0}
              </strong>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Estado</p>
              <strong className="text-2xl text-foreground">
                {summary?.program?.status || "Sin programa"}
              </strong>
            </Card>
          </div>

          <Card className="flex items-start gap-3 border-primary/30 bg-primary/[0.04] p-5">
            <Info className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="grid gap-1">
              <h2 className="font-semibold text-foreground">
                Las tarjetas se crean automáticamente
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Cuando un cliente completa su primer turno elegible, recibe una tarjeta,
                suma sus primeros sellos y recibe un correo para verla. También le
                avisaremos cada vez que obtenga un nuevo beneficio.
              </p>
            </div>
          </Card>

          {isDevelopment ? (
            <Card className="grid gap-5 border-amber-400/30 bg-amber-400/[0.04] p-5">
              <div className="flex items-start gap-3">
                <FlaskConical className="mt-0.5 size-5 shrink-0 text-amber-300" />
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">
                      Herramientas de prueba
                    </h2>
                    <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-200">
                      Solo desarrollo
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Completá un turno confirmado ahora para probar la tarjeta,
                    los sellos, las recompensas y el correo sin esperar a que
                    termine el horario reservado.
                  </p>
                </div>
              </div>

              {developmentCompletionMutation.isSuccess ? (
                <div
                  role="status"
                  className="grid gap-1 rounded-lg border border-primary/25 bg-primary/[0.06] p-4 text-sm"
                >
                  <strong className="text-primary">
                    Turno completado y flujo procesado
                  </strong>
                  <span className="text-muted-foreground">
                    {developmentCompletionMutation.data.loyalty.cardCreated
                      ? "Se creó una tarjeta. "
                      : ""}
                    Se aplicaron{" "}
                    {developmentCompletionMutation.data.loyalty.stampsApplied} sellos
                    y se generaron{" "}
                    {developmentCompletionMutation.data.loyalty.rewardsGenerated} beneficios.
                  </span>
                  {developmentCompletionMutation.data.loyalty
                    .notificationAttempted ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MailCheck className="size-4 text-primary" />
                      Se intentó enviar la notificación al correo del cliente.
                    </span>
                  ) : null}
                </div>
              ) : null}

              {developmentCompletionMutation.isError ? (
                <p role="alert" className="text-sm text-destructive">
                  No se pudo completar el turno. Verificá que siga confirmado e
                  intentá nuevamente.
                </p>
              ) : null}

              {developmentAppointments?.items.length ? (
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Turno confirmado
                    <select
                      value={developmentAppointmentId}
                      onChange={(event) => {
                        setDevelopmentAppointmentId(event.target.value);
                        setDevelopmentConfirmed(false);
                        developmentCompletionMutation.reset();
                      }}
                      className="h-11 rounded-md border border-amber-300/30 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Seleccioná un turno</option>
                      {developmentAppointments.items.map((appointment) => (
                        <option key={appointment.id} value={appointment.id}>
                          {appointment.user?.name || appointment.userName || "Cliente"} ·{" "}
                          {appointment.service?.name || "Servicio"} ·{" "}
                          {formatLocalDate(
                            appointment.startDateTime,
                            user?.timezone,
                            "dd/MM/yyyy HH:mm",
                          )}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedDevelopmentAppointment ? (
                    <div className="grid gap-4 rounded-lg border border-amber-300/20 bg-background/60 p-4">
                      <div className="grid gap-1 text-sm">
                        <strong className="text-foreground">
                          {selectedDevelopmentAppointment.user?.name ||
                            selectedDevelopmentAppointment.userName ||
                            "Cliente"}
                        </strong>
                        <span className="text-muted-foreground">
                          {selectedDevelopmentAppointment.service?.name || "Servicio"} ·{" "}
                          {formatLocalDate(
                            selectedDevelopmentAppointment.startDateTime,
                            user?.timezone,
                            "EEEE d 'de' MMMM, HH:mm 'hs'",
                          )}
                        </span>
                      </div>

                      <label className="flex items-start gap-3 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={developmentConfirmed}
                          onChange={(event) =>
                            setDevelopmentConfirmed(event.target.checked)
                          }
                          className="mt-0.5 size-4 accent-primary"
                        />
                        <span>
                          Confirmo que quiero marcar este turno como completado.
                          Esta acción modifica los datos del entorno de desarrollo.
                        </span>
                      </label>

                      <Button
                        type="button"
                        onClick={() =>
                          developmentCompletionMutation.mutate(
                            selectedDevelopmentAppointment.id,
                          )
                        }
                        disabled={
                          !developmentConfirmed ||
                          developmentCompletionMutation.isPending
                        }
                      >
                        <FlaskConical />
                        {developmentCompletionMutation.isPending
                          ? "Completando..."
                          : "Completar para prueba"}
                      </Button>
                    </div>
                  ) : null}

                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-amber-300/20 p-4 text-sm text-muted-foreground">
                  No hay turnos confirmados disponibles. Creá uno desde Turnos y
                  volvé a esta sección.
                </p>
              )}
            </Card>
          ) : null}

          <Card className="p-5">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <input name="name" defaultValue={defaultValues.name} className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Sellos necesarios
                  <input name="stampsRequired" type="number" min={1} defaultValue={defaultValues.stampsRequired} className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Vence tarjeta en dias
                  <input name="cardExpiresAfterDays" type="number" min={1} defaultValue={defaultValues.cardExpiresAfterDays} className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Vence recompensa en dias
                  <input name="rewardExpiresAfterDays" type="number" min={1} defaultValue={defaultValues.rewardExpiresAfterDays} className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" />
                </label>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Recompensa</span>
                <div className="flex flex-wrap gap-2">
                  {rewardOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRewardType(option.value)}
                      aria-pressed={rewardType === option.value}
                      className={`rounded-md px-3 py-2 text-sm transition-[border-color,background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        rewardType === option.value
                          ? "border-2 border-primary bg-primary/10 text-primary"
                          : "border border-border text-muted-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {rewardType === "FREE_SERVICE" ? (
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Servicio gratis
                  <select name="rewardServiceId" defaultValue={defaultValues.rewardServiceId} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Valor
                  <input name="rewardValue" type="number" min={0} defaultValue={defaultValues.rewardValue} className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" />
                </label>
              )}

              <Button type="submit" disabled={saveMutation.isPending || isLoading}>
                <Save />
                {saveMutation.isPending ? "Guardando..." : "Guardar programa"}
              </Button>
            </form>
          </Card>

          <Card className="grid gap-4 p-5">
            <div className="flex items-center gap-2">
              <Ticket className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Clientes con tarjeta</h2>
            </div>
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavia no hay tarjetas emitidas.</p>
            ) : (
              <div className="grid gap-3">
                {cards.map((card) => {
                  const required = card.revision.stampsRequired;
                  const progress = Math.min(100, (card.stampsBalance / required) * 100);
                  const availableRewards = card.rewards.filter(
                    (reward) => reward.status === "AVAILABLE",
                  ).length;
                  const isAdjusting = adjustingCardId === card.id;

                  return (
                    <article
                      key={card.id}
                      className="grid gap-4 rounded-xl border border-border bg-background/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                        <div className="grid gap-1">
                          <strong className="text-foreground">
                            {card.user?.name || card.guestIdentity?.email || "Cliente"}
                          </strong>
                          <span className="text-xs text-muted-foreground">
                            {card.user?.email || "Cliente invitado"}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setAdjustingCardId(isAdjusting ? null : card.id);
                            setAdjustment("");
                            setAdjustmentReason("");
                          }}
                        >
                          {isAdjusting ? "Cancelar" : "Ajustar sellos"}
                        </Button>
                      </div>

                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium text-foreground">
                            {card.stampsBalance}/{required} sellos
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-[width]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary">
                          <Gift className="size-3.5" />
                          {availableRewards} beneficios disponibles
                        </span>
                        {card.movements?.[0] ? (
                          <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                            Último movimiento: {card.movements[0].stamps > 0 ? "+" : ""}
                            {card.movements[0].stamps} sellos
                          </span>
                        ) : null}
                      </div>

                      {isAdjusting ? (
                        <form
                          className="grid gap-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4 md:grid-cols-[140px_1fr_auto]"
                          onSubmit={(event) => {
                            event.preventDefault();
                            adjustMutation.mutate({
                              cardId: card.id,
                              stamps: Number(adjustment),
                              reason: adjustmentReason.trim(),
                            });
                          }}
                        >
                          <label className="grid gap-2 text-sm font-medium text-foreground">
                            Sellos
                            <input
                              type="number"
                              min={-100}
                              max={100}
                              value={adjustment}
                              onChange={(event) => setAdjustment(event.target.value)}
                              placeholder="+1 o -1"
                              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                              required
                            />
                          </label>
                          <label className="grid gap-2 text-sm font-medium text-foreground">
                            Motivo
                            <input
                              value={adjustmentReason}
                              onChange={(event) => setAdjustmentReason(event.target.value)}
                              placeholder="Ej. Visita registrada manualmente"
                              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                              required
                            />
                          </label>
                          <Button
                            type="submit"
                            className="self-end"
                            disabled={
                              adjustMutation.isPending ||
                              Number(adjustment) === 0 ||
                              !adjustmentReason.trim()
                            }
                          >
                            {adjustMutation.isPending ? "Guardando..." : "Guardar ajuste"}
                          </Button>
                          {adjustMutation.isError ? (
                            <p className="text-sm text-destructive md:col-span-3">
                              No se pudo guardar el ajuste. Revisá los datos e intentá nuevamente.
                            </p>
                          ) : null}
                        </form>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </section>
  );
}
