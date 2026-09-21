"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
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
import { benefitSentence } from "@/lib/utils/loyalty";
import { loyaltyService } from "@/services/loyalty";
import { timelineService } from "@/services/timeline";
import { StampCard } from "@/components/loyalty/StampCard";
import type {
  LoyaltyCard,
  LoyaltyProgramPayload,
  LoyaltyRewardType,
} from "@/lib/types/loyalty";

const rewardOptions: Array<{ value: LoyaltyRewardType; label: string }> = [
  { value: "FREE_SERVICE", label: "Servicio gratis" },
  { value: "PERCENTAGE_DISCOUNT", label: "Descuento %" },
  { value: "FIXED_DISCOUNT", label: "Descuento fijo" },
];

// Los vencimientos viajan al backend en días. Mostrarlos así obliga al dueño a
// traducir 365 o 90 mentalmente, así que las opciones se nombran y el número
// queda como detalle de transporte.
const cardExpiryOptions = [
  { value: 90, label: "3 meses" },
  { value: 180, label: "6 meses" },
  { value: 365, label: "1 año" },
  { value: 730, label: "2 años" },
];

const rewardExpiryOptions = [
  { value: 30, label: "1 mes" },
  { value: 60, label: "2 meses" },
  { value: 90, label: "3 meses" },
  { value: 180, label: "6 meses" },
  { value: 365, label: "1 año" },
];

/** Si el programa guardado usa un plazo que no está en la lista, se agrega. */
function expiryOptionsWith(
  options: Array<{ value: number; label: string }>,
  current: number,
) {
  if (options.some((option) => option.value === current)) return options;
  return [...options, { value: current, label: `${current} días` }].sort(
    (a, b) => a.value - b.value,
  );
}

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

  // El form pasa a ser controlado para poder mostrar el resumen y el preview en
  // vivo: con `defaultValue` + FormData no hay forma de leer los valores
  // mientras el dueño escribe.
  const [form, setForm] = useState(defaultValues);

  // Se resincroniza SOLO cuando llega o cambia la revision guardada.
  // Depender del objeto `defaultValues` seria un loop infinito: `services`
  // arranca en un `[]` literal nuevo en cada render, asi que el useMemo cambia
  // de identidad siempre y el efecto se dispararia en cada render.
  const savedRevisionId = latestRevision?.id;
  useEffect(() => {
    setForm(defaultValues);
    setRewardType(latestRevision?.rewardType || "FREE_SERVICE");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedRevisionId]);

  // El servicio por defecto recien se puede elegir cuando llega la lista.
  // El guard corta antes del setState, asi que la identidad inestable de
  // `services` no reabre el loop de arriba.
  useEffect(() => {
    if (form.rewardServiceId || !services.length) return;
    setForm((prev) => ({ ...prev, rewardServiceId: services[0].id }));
  }, [services, form.rewardServiceId]);

  function updateForm<K extends keyof typeof defaultValues>(
    field: K,
    value: (typeof defaultValues)[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    saveMutation.reset();
  }

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
    const payload: LoyaltyProgramPayload = {
      name: form.name.trim() || "Tarjeta de fidelidad",
      stampsRequired: Math.max(Number(form.stampsRequired) || 6, 1),
      stampsPerAppointment: 1,
      rewardType,
      rewardValue:
        rewardType === "FREE_SERVICE" ? undefined : Number(form.rewardValue) || 0,
      rewardServiceId:
        rewardType === "FREE_SERVICE" && form.rewardServiceId
          ? Number(form.rewardServiceId)
          : undefined,
      cardExpiresAfterDays: Number(form.cardExpiresAfterDays) || 365,
      rewardExpiresAfterDays: Number(form.rewardExpiresAfterDays) || 90,
      status: "ACTIVE",
    };
    saveMutation.mutate(payload);
  }

  const stampsRequired = Math.max(Number(form.stampsRequired) || 1, 1);
  const summarySentence = benefitSentence(
    stampsRequired,
    rewardType,
    rewardType === "FREE_SERVICE" ? null : form.rewardValue,
  );

  // Tarjeta sintética con los valores del form: el dueño ve exactamente el
  // mismo componente que renderiza la pantalla del cliente.
  const previewCard: LoyaltyCard = {
    id: "preview",
    localId,
    stampsBalance: Math.min(Math.max(Math.floor(stampsRequired / 3), 1), stampsRequired),
    totalStampsEarned: 0,
    status: "ACTIVE",
    expiresAt: null,
    local: { id: localId, name: user?.localName || user?.name || "Tu local" },
    program: {
      id: "preview",
      localId,
      name: form.name.trim() || "Tarjeta de fidelidad",
      status: "ACTIVE",
      revisions: [],
      services: [],
    },
    revision: {
      id: "preview",
      version: 1,
      stampsRequired,
      stampsPerAppointment: 1,
      rewardType,
      rewardValue: rewardType === "FREE_SERVICE" ? null : form.rewardValue,
      rewardServiceId: form.rewardServiceId ?? null,
    },
    rewards: [],
  };

  const programCard = (
    <Card className="grid grid-cols-1 gap-6 p-5">
      <div className="grid grid-cols-1 gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          {summary?.program ? "Configuración del programa" : "Creá tu programa"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Definí cuántos sellos hacen falta y qué gana el cliente al completarlos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
          <label className="grid grid-cols-1 gap-2 text-sm font-medium text-foreground">
            Nombre del programa
            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              className="h-11 rounded-md border border-input bg-transparent px-3 text-sm"
              placeholder="Tarjeta de fidelidad"
            />
          </label>

          <label className="grid grid-cols-1 gap-2 text-sm font-medium text-foreground">
            Sellos necesarios
            <input
              type="number"
              min={1}
              max={30}
              required
              value={form.stampsRequired}
              onChange={(event) =>
                updateForm("stampsRequired", Number(event.target.value))
              }
              className="h-11 rounded-md border border-input bg-transparent px-3 text-sm"
            />
            <span className="text-xs font-normal text-muted-foreground">
              Cada turno completado suma un sello.
            </span>
          </label>

          <fieldset className="grid grid-cols-1 gap-2">
            <legend className="text-sm font-medium text-foreground">
              Recompensa
            </legend>
            <div className="flex flex-wrap gap-2">
              {rewardOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setRewardType(option.value);
                    saveMutation.reset();
                  }}
                  aria-pressed={rewardType === option.value}
                  className={`min-h-11 rounded-md px-3 text-sm transition-[border-color,background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    rewardType === option.value
                      ? "border-2 border-primary bg-primary/10 text-primary"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {rewardType === "FREE_SERVICE" ? (
            <label className="grid grid-cols-1 gap-2 text-sm font-medium text-foreground">
              ¿Qué servicio regalás?
              <select
                value={form.rewardServiceId ?? ""}
                onChange={(event) =>
                  updateForm("rewardServiceId", Number(event.target.value))
                }
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="grid grid-cols-1 gap-2 text-sm font-medium text-foreground">
              {rewardType === "PERCENTAGE_DISCOUNT"
                ? "Porcentaje de descuento"
                : "Monto del descuento"}
              {/* El mismo campo significaba a veces un porcentaje y a veces
                  pesos, sin ninguna marca. El afijo lo desambigua. */}
              <span className="flex h-11 items-center overflow-hidden rounded-md border border-input">
                {rewardType === "FIXED_DISCOUNT" ? (
                  <span className="grid h-full w-10 shrink-0 place-items-center border-r border-input bg-muted text-sm text-muted-foreground">
                    $
                  </span>
                ) : null}
                <input
                  type="number"
                  min={0}
                  max={rewardType === "PERCENTAGE_DISCOUNT" ? 100 : undefined}
                  required
                  value={form.rewardValue}
                  onChange={(event) =>
                    updateForm("rewardValue", Number(event.target.value))
                  }
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                />
                {rewardType === "PERCENTAGE_DISCOUNT" ? (
                  <span className="grid h-full w-10 shrink-0 place-items-center border-l border-input bg-muted text-sm text-muted-foreground">
                    %
                  </span>
                ) : null}
              </span>
            </label>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid grid-cols-1 gap-2 text-sm font-medium text-foreground">
              La tarjeta vence a los
              <select
                value={form.cardExpiresAfterDays}
                onChange={(event) =>
                  updateForm("cardExpiresAfterDays", Number(event.target.value))
                }
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                {expiryOptionsWith(
                  cardExpiryOptions,
                  Number(form.cardExpiresAfterDays),
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal text-muted-foreground">
                Contados desde el primer sello.
              </span>
            </label>

            <label className="grid grid-cols-1 gap-2 text-sm font-medium text-foreground">
              El beneficio vence a los
              <select
                value={form.rewardExpiresAfterDays}
                onChange={(event) =>
                  updateForm("rewardExpiresAfterDays", Number(event.target.value))
                }
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                {expiryOptionsWith(
                  rewardExpiryOptions,
                  Number(form.rewardExpiresAfterDays),
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal text-muted-foreground">
                Contados desde que el cliente completa la tarjeta.
              </span>
            </label>
          </div>

          <p className="rounded-lg border border-primary/25 bg-primary/[0.06] p-4 text-sm text-foreground">
            {summarySentence}
          </p>

          {saveMutation.isError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              No pudimos guardar el programa. Revisá los datos e intentá de nuevo.
            </p>
          ) : null}

          {saveMutation.isSuccess ? (
            <p
              role="status"
              className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary"
            >
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              Programa guardado. Los clientes ya ven la tarjeta actualizada.
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={saveMutation.isPending || isLoading}
            className="justify-self-start"
          >
            <Save />
            {saveMutation.isPending ? "Guardando..." : "Guardar programa"}
          </Button>
        </form>

        <div className="grid grid-cols-1 gap-2 content-start">
          <p className="text-sm font-medium text-foreground">
            Así la ve tu cliente
          </p>
          <StampCard card={previewCard} timezone={user?.timezone} />
        </div>
      </div>
    </Card>
  );

  return (
    <section className="relative grid grid-cols-1 gap-6">
      <header className="flex items-start justify-between gap-4 max-sm:flex-col">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Enterprise
          </p>
          <h1 className="text-2xl font-bold text-foreground">Fidelidad</h1>
          <p className="text-muted-foreground">
            Configurá sellos, vencimientos y beneficios para tus clientes.
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
          {/* Sin programa configurado, el form es la unica accion posible en
              esta pantalla: no puede estar quinto, debajo de metricas en cero. */}
          {!summary?.program ? programCard : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            <div className="grid grid-cols-1 gap-1">
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
            <Card className="grid grid-cols-1 gap-5 border-amber-400/30 bg-amber-400/[0.04] p-5">
              <div className="flex items-start gap-3">
                <FlaskConical className="mt-0.5 size-5 shrink-0 text-amber-300" />
                <div className="grid grid-cols-1 gap-1">
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
                  className="grid grid-cols-1 gap-1 rounded-lg border border-primary/25 bg-primary/[0.06] p-4 text-sm"
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
                <div className="grid grid-cols-1 gap-4">
                  <label className="grid grid-cols-1 gap-2 text-sm font-medium text-foreground">
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
                    <div className="grid grid-cols-1 gap-4 rounded-lg border border-amber-300/20 bg-background/60 p-4">
                      <div className="grid grid-cols-1 gap-1 text-sm">
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

          {summary?.program ? programCard : null}

          <Card className="grid grid-cols-1 gap-4 p-5">
            <div className="flex items-center gap-2">
              <Ticket className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Clientes con tarjeta</h2>
            </div>
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay tarjetas emitidas.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
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
                      className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-background/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                        <div className="grid grid-cols-1 gap-1">
                          <strong className="text-foreground">
                            {card.user?.name ||
                              card.guestIdentity?.email ||
                              card.guestIdentity?.phone ||
                              "Cliente"}
                          </strong>
                          <span className="text-xs text-muted-foreground">
                            {card.user?.email ||
                              card.guestIdentity?.email ||
                              card.guestIdentity?.phone ||
                              "Cliente invitado"}
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

                      <div className="grid grid-cols-1 gap-2">
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
                          className="grid grid-cols-1 gap-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4 md:grid-cols-[140px_1fr_auto]"
                          onSubmit={(event) => {
                            event.preventDefault();
                            adjustMutation.mutate({
                              cardId: card.id,
                              stamps: Number(adjustment),
                              reason: adjustmentReason.trim(),
                            });
                          }}
                        >
                          <label className="grid grid-cols-1 gap-2 text-sm font-medium text-foreground">
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
                          <label className="grid grid-cols-1 gap-2 text-sm font-medium text-foreground">
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
