import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { useScheduleTemplateList } from "@/features/local/hooks/useScheduleTemplateList";
import { scheduleService } from "@/features/local/services/schedule.service";
import { useAuthStore } from "@/stores/auth";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const DAYS = [
  { key: 1, label: 'Lunes' },
  { key: 2, label: 'Martes' },
  { key: 3, label: 'Miercoles' },
  { key: 4, label: 'Jueves' },
  { key: 5, label: 'Viernes' },
  { key: 6, label: 'Sabado' },
  { key: 0, label: 'Domingo' },
] as const;

function IconAdd() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

interface DaySlots {
  active: boolean;
  slots: { start: string; end: string }[];
}

const emptySchedule: Record<number, DaySlots> = {
  0: { active: false, slots: [] },
  1: { active: false, slots: [] },
  2: { active: false, slots: [] },
  3: { active: false, slots: [] },
  4: { active: false, slots: [] },
  5: { active: false, slots: [] },
  6: { active: false, slots: [] },
};

export function LocalScheduleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { templates, refreshTemplates } = useScheduleTemplateList();
  const isNew = id === 'new';

  const existingTemplate = !isNew ? templates.find(t => t.id === id) : null;

  const [name, setName] = useState(existingTemplate?.name || '');
  const [schedule, setSchedule] = useState<Record<number, DaySlots>>(emptySchedule);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  function handleDayToggle(dayNum: number) {
    setSchedule(prev => ({
      ...prev,
      [dayNum]: { ...prev[dayNum], active: !prev[dayNum].active },
    }));
  }

  function handleAddSlot(dayNum: number) {
    setSchedule(prev => ({
      ...prev,
      [dayNum]: {
        ...prev[dayNum],
        slots: [...prev[dayNum].slots, { start: '09:00', end: '18:00' }],
      },
    }));
  }

  function handleRemoveSlot(dayNum: number, slotIndex: number) {
    setSchedule(prev => ({
      ...prev,
      [dayNum]: {
        ...prev[dayNum],
        slots: prev[dayNum].slots.filter((_, i) => i !== slotIndex),
      },
    }));
  }

  function handleSlotChange(dayNum: number, slotIndex: number, field: 'start' | 'end', value: string) {
    setSchedule(prev => ({
      ...prev,
      [dayNum]: {
        ...prev[dayNum],
        slots: prev[dayNum].slots.map((slot, i) =>
          i === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  }

  function validate(): boolean {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push('Ingresa un nombre para la plantilla');
    }

    const activeDays = Object.entries(schedule).filter(([_, data]) => data.active);
    if (activeDays.length === 0) {
      errors.push('Selecciona al menos un dia activo');
    }

    for (const [dayNum, dayData] of activeDays) {
      if (dayData.slots.length === 0) {
        errors.push(`${DAYS.find(d => d.key === Number(dayNum))?.label}: debe tener al menos un horario`);
      }
      for (let i = 0; i < dayData.slots.length; i++) {
        const slot = dayData.slots[i];
        if (slot.start >= slot.end) {
          errors.push(`${DAYS.find(d => d.key === Number(dayNum))?.label}: horario ${i + 1}: la hora de fin debe ser posterior`);
        }
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }

  async function handleSave() {
    if (!user?.id) return;

    if (!validate()) return;

    setIsSaving(true);
    setSaveError(null);
    const localId = user?.id || '';

    try {
      const timeStockTemplates = DAYS.flatMap(day => {
        const dayData = schedule[day.key];
        if (!dayData.active || dayData.slots.length === 0) return [];

        return dayData.slots.map(slot => ({
          id: '',
          dayOfWeek: day.key,
          startTime: slot.start,
          endTime: slot.end,
          isActive: true,
          localId: localId,
          scheduleTemplateId: isNew ? '' : (id || ''),
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
        const existing = templates.find(t => t.id === id);
        if (existing) {
          await scheduleService.updateTemplate(id, {
            id,
            name,
            isActive: true,
            localId: localId,
            timeStockTemplates,
            createdAt: '',
            updatedAt: new Date().toISOString(),
          });
        }
      }

      await refreshTemplates();
      navigate('/local/schedules');
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar la plantilla');
    } finally {
      setIsSaving(false);
    }
  }

  const activeDaysCount = Object.values(schedule).filter(d => d.active && d.slots.length > 0).length;

  return (
    <section className="grid gap-6">
      <header className="flex items-center gap-4">
        <button
          onClick={() => navigate('/local/schedules')}
          className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-[#00f068]/30 transition-all"
        >
          <IconBack />
        </button>
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Configuracion</p>
          <h2 className="text-2xl font-bold text-white">{isNew ? 'Nueva plantilla' : 'Editar plantilla'}</h2>
        </div>
      </header>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Nombre de la plantilla</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Horario regular de verano"
            className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50 focus:ring-1 focus:ring-[#00f068]/30 transition-all"
          />
        </div>

        <div className="border border-white/12 bg-white/[0.02] rounded-[28px] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Dias laborables</h3>
              <p className="text-sm text-white/50">{activeDaysCount} dia{activeDaysCount !== 1 ? 's' : ''} activo{activeDaysCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="space-y-4">
            {DAYS.map((day) => (
              <div
                key={day.key}
                className={`p-4 rounded-xl border transition-all ${
                  schedule[day.key].active
                    ? 'border-[#00f068]/30 bg-[#00f068]/5'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={schedule[day.key].active}
                      onClick={() => handleDayToggle(day.key)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        schedule[day.key].active ? 'bg-[#00f068]' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          schedule[day.key].active ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`font-medium ${schedule[day.key].active ? 'text-white' : 'text-white/60'}`}>
                      {day.label}
                    </span>
                  </div>

                  {schedule[day.key].active && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-[#00f068] border-[#00f068]/30"
                      onClick={() => handleAddSlot(day.key)}
                    >
                      <span className="flex items-center gap-1">
                        <IconAdd /> Agregar horario
                      </span>
                    </Button>
                  )}
                </div>

                {schedule[day.key].active && schedule[day.key].slots.length > 0 && (
                  <div className="space-y-2 ml-15">
                    {schedule[day.key].slots.map((slot, slotIdx) => (
                      <div key={slotIdx} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => handleSlotChange(day.key, slotIdx, 'start', e.target.value)}
                            className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-white focus:outline-none focus:border-[#00f068]/50"
                          />
                          <span className="text-white/40">a</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => handleSlotChange(day.key, slotIdx, 'end', e.target.value)}
                            className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-white focus:outline-none focus:border-[#00f068]/50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(day.key, slotIdx)}
                          className="p-2 text-[#ff5678] hover:bg-[#ff5678]/10 rounded-lg transition-colors"
                        >
                          <IconDelete />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {schedule[day.key].active && schedule[day.key].slots.length === 0 && (
                  <p className="text-sm text-white/50 ml-15">Sin horarios configurados</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] space-y-1">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-[#ffd6df] text-sm">{err}</p>
          ))}
        </div>
      )}

      {saveError && (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {saveError}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate('/local/schedules')}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar plantilla'}
        </Button>
      </div>
    </section>
  );
}