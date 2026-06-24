"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Switch } from "@/components/ui/switch";
import { useScheduleTemplatesQuery } from "@/hooks/queries/useScheduleTemplatesQuery";
import { scheduleService } from "@/features/local/services/schedule.service";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/auth";

export default function LocalSchedulesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: templates = [], isLoading, error } = useScheduleTemplatesQuery();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const localId = user?.id ?? "";

  async function handleToggleActive(
    templateId: string,
    currentState: boolean,
  ) {
    try {
      await scheduleService.updateTemplateStatus(templateId, !currentState);
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduleTemplates(localId),
      });
    } catch (err) {
      console.error("Error toggling template status:", err);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await scheduleService.deleteTemplate(deleteId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduleTemplates(localId),
      });
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting template:", err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="grid gap-6">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Configuración
          </p>
          <h2 className="text-2xl font-bold text-white">
            Plantillas de Horarios
          </h2>
        </div>
        <Link href="/local/schedules/edit/new">
          <Button>
            <span className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Nueva plantilla
            </span>
          </Button>
        </Link>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[200px] grid place-items-center text-white/50">
          Cargando plantillas...
        </div>
      ) : templates.length === 0 ? (
        <div className="min-h-[200px] grid place-items-center text-center rounded-xl border border-border bg-card p-8">
          <div className="text-muted-foreground/40 mb-4">
            <CalendarDays className="w-5 h-5" />
          </div>
          <p className="text-muted-foreground mb-4">
            No hay plantillas de horario configuradas.
          </p>
          <Link href="/local/schedules/edit/new">
            <Button variant="secondary">Crear primera plantilla</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <article
              key={template.id}
              className="border border-border bg-card rounded-xl shadow-sm p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${template.isActive ? "bg-primary" : "bg-muted-foreground/30"}`}
                />
                <div>
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {template.timeSlotsCount} horario
                    {template.timeSlotsCount !== 1 ? "s" : ""} configurado
                    {template.timeSlotsCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    {template.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <Switch
                    checked={template.isActive}
                    onCheckedChange={() =>
                      handleToggleActive(template.id, template.isActive)
                    }
                  />
                </label>

                <Link href={`/local/schedules/edit/${template.id}`}>
                  <Button variant="secondary" className="p-3">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  className="p-3 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setDeleteId(template.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Eliminar plantilla"
        description="¿Está seguro de que desea eliminar esta plantilla de horario? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </section>
  );
}
