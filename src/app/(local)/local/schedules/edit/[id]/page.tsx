"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { scheduleService } from "@/features/local/services/schedule.service";
import { useAuthStore } from "@/stores/auth";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

const DAYS = [
  { key: 1, label: "Lunes" },
  { key: 2, label: "Martes" },
  { key: 3, label: "Miércoles" },
  { key: 4, label: "Jueves" },
  { key: 5, label: "Viernes" },
  { key: 6, label: "Sábado" },
  { key: 7, label: "Domingo" },
] as const;

interface DaySlots {
  active: boolean;
  slots: { start: string; end: string }[];
}

const emptySchedule: Record<number, DaySlots> = {
  1: { active: false, slots: [] },
  2: { active: false, slots: [] },
  3: { active: false, slots: [] },
  4: { active: false, slots: [] },
  5: { active: false, slots: [] },
  6: { active: false, slots: [] },
  7: { active: false, slots: [] },
};

export default function LocalScheduleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [name, setName] = useState("");
  const [schedule, setSchedule] =
    useState<Record<number, DaySlots>>(emptySchedule);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(!isNew);

  const localId = user?.id ?? "";

  // Cargar plantilla completa al editar
  useEffect(() => {
    if (!id || isNew) {
      setIsLoadingTemplate(false);
      return;
    }
    let cancelled = false;

    async function loadTemplate() {
      try {
        const full = await scheduleService.getTemplate(id);
        if (cancelled || !full) return;
        setName(full.name);
        const loaded: Record<number, DaySlots> = { ...emptySchedule };
        for (const slot of full.timeStockTemplates) {
          if (!slot.isActive) continue;
          const dayNum = slot.dayOfWeek; // ISO: 1=lunes…7=domingo
          loaded[dayNum] = { active: true, slots: [] };
        }
        for (const slot of full.timeStockTemplates) {
          if (!slot.isActive) continue;
          const dayNum = slot.dayOfWeek;
          loaded[dayNum].slots.push({ start: slot.startTime, end: slot.endTime });
        }
        if (!cancelled) setSchedule(loaded);
      } catch (err) {
        console.error("Error loading template:", err);
      } finally {
        if (!cancelled) setIsLoadingTemplate(false);
      }
    }

    loadTemplate();
    return () => { cancelled = true; };
  }, [id, isNew]);

  function handleDayToggle(dayNum: number) {
    setSchedule((prev) => {
      const wasActive = prev[dayNum].active;
      const becomingActive = !wasActive;
      const needsDefaultSlot = becomingActive && prev[dayNum].slots.length === 0;
      return {
        ...prev,
        [dayNum]: {
          active: becomingActive,
          slots: needsDefaultSlot
            ? [{ start: "09:00", end: "18:00" }]
            : prev[dayNum].slots,
        },
      };
    });
  }

  function handleAddSlot(dayNum: number) {
    setSchedule((prev) => ({
      ...prev,
      [dayNum]: {
        ...prev[dayNum],
        slots: [...prev[dayNum].slots, { start: "09:00", end: "18:00" }],
      },
    }));
  }

  function handleRemoveSlot(dayNum: number, slotIndex: number) {
    setSchedule((prev) => ({
      ...prev,
      [dayNum]: {
        ...prev[dayNum],
        slots: prev[dayNum].slots.filter((_, i) => i !== slotIndex),
      },
    }));
  }

  function handleSlotChange(
    dayNum: number,
    slotIndex: number,
    field: "start" | "end",
    value: string,
  ) {
    setSchedule((prev) => ({
      ...prev,
      [dayNum]: {
        ...prev[dayNum],
        slots: prev[dayNum].slots.map((slot, i) =>
          i === slotIndex ? { ...slot, [field]: value } : slot,
        ),
      },
    }));
  }

  function validate(): boolean {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push("Ingresa un nombre para la plantilla");
    }

    const activeDays = Object.entries(schedule).filter(
      ([_, data]) => data.active,
    );
    if (activeDays.length === 0) {
      errors.push("Selecciona al menos un dia activo");
    }

    for (const [dayNum, dayData] of activeDays) {
      if (dayData.slots.length === 0) {
        errors.push(
          `${DAYS.find((d) => d.key === Number(dayNum))?.label}: debe tener al menos un horario`,
        );
      }
      for (let i = 0; i < dayData.slots.length; i++) {
        const slot = dayData.slots[i];
        if (slot.start >= slot.end) {
          errors.push(
            `${DAYS.find((d) => d.key === Number(dayNum))?.label}: horario ${i + 1}: la hora de fin debe ser posterior`,
          );
        }
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }

  async function handleSave() {
    if (!localId) return;

    if (!validate()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const timeStockTemplates = DAYS.flatMap((day) => {
        const dayData = schedule[day.key];
        if (!dayData.active || dayData.slots.length === 0) return [];

        return dayData.slots.map((slot) => ({
          id: "",
          dayOfWeek: day.key,
          startTime: slot.start,
          endTime: slot.end,
          isActive: true,
          localId: localId,
          scheduleTemplateId: isNew ? "" : id || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      });

      if (isNew) {
        await scheduleService.createTemplate({
          name,
          localId: localId,
          timeStockTemplates,
        });
      } else if (id) {
        await scheduleService.updateTemplate(id, {
          id,
          name,
          isActive: true,
          localId: localId,
          timeStockTemplates,
          createdAt: "",
          updatedAt: new Date().toISOString(),
        });
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduleTemplates(localId),
      });
      router.push("/local/schedules");
    } catch (err: any) {
      setSaveError(err.message || "Error al guardar la plantilla");
    } finally {
      setIsSaving(false);
    }
  }

  const activeDaysCount = Object.values(schedule).filter(
    (d) => d.active && d.slots.length > 0,
  ).length;

  return (
    <section className="grid gap-6">
      <header className="flex items-center gap-4">
        <button
          onClick={() => router.push("/local/schedules")}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Configuración
          </p>
          <h2 className="text-2xl font-bold text-white">
            {isNew ? "Nueva plantilla" : "Editar plantilla"}
          </h2>
        </div>
      </header>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">
            Nombre de la plantilla
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Horario regular de verano"
            className="h-10"
          />
        </div>

        <div className="border border-border bg-card rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Días laborables</h3>
              <p className="text-sm text-muted-foreground">
                {activeDaysCount} día{activeDaysCount !== 1 ? "s" : ""} activo
                {activeDaysCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {DAYS.map((day) => (
              <div
                key={day.key}
                className={`p-4 rounded-xl border transition-all ${
                  schedule[day.key]?.active
                    ? "border-primary/30 bg-primary/[0.04]"
                    : "border-border bg-muted/20"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={schedule[day.key]?.active ?? false}
                      onCheckedChange={() => handleDayToggle(day.key)}
                    />
                    <span
                      className={`font-medium ${
                        schedule[day.key]?.active
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>

                  {schedule[day.key]?.active && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-primary border-primary/30"
                      onClick={() => handleAddSlot(day.key)}
                    >
                      <span className="flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Agregar horario
                      </span>
                    </Button>
                  )}
                </div>

                {schedule[day.key].active &&
                  schedule[day.key].slots.length > 0 && (
                    <div className="space-y-2 ml-15">
                      {schedule[day.key].slots.map((slot, slotIdx) => (
                        <div
                          key={slotIdx}
                          className="flex items-center gap-3"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) =>
                                handleSlotChange(
                                  day.key,
                                  slotIdx,
                                  "start",
                                  e.target.value,
                                )
                              }
                              className="w-auto"
                            />
                            <span className="text-muted-foreground">a</span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) =>
                                handleSlotChange(
                                  day.key,
                                  slotIdx,
                                  "end",
                                  e.target.value,
                                )
                              }
                              className="w-auto"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveSlot(day.key, slotIdx)
                            }
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                {schedule[day.key].active &&
                  schedule[day.key].slots.length === 0 && (
                    <p className="text-sm text-muted-foreground ml-15">
                      Sin horarios configurados
                    </p>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 space-y-1 text-sm text-destructive">
          {validationErrors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {saveError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => router.push("/local/schedules")}
        >
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar plantilla"}
        </Button>
      </div>
    </section>
  );
}
