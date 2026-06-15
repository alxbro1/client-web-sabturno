"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { useScheduleTemplatesQuery } from "@/hooks/queries/useScheduleTemplatesQuery";
import { scheduleService } from "@/features/local/services/schedule.service";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/auth";

function IconSchedule() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function IconAdd() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

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
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Configuracion
          </p>
          <h2 className="text-2xl font-bold text-white">
            Plantillas de Horarios
          </h2>
        </div>
        <Link href="/local/schedules/edit/new">
          <Button>
            <span className="flex items-center gap-2">
              <IconAdd /> Nueva plantilla
            </span>
          </Button>
        </Link>
      </header>

      {error && (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[200px] grid place-items-center text-white/50">
          Cargando plantillas...
        </div>
      ) : templates.length === 0 ? (
        <div className="min-h-[200px] grid place-items-center text-center rounded-[28px] border border-white/10 bg-white/[0.02] p-8">
          <div className="text-white/40 mb-4">
            <IconSchedule />
          </div>
          <p className="text-white/60 mb-4">
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
              className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${template.isActive ? "bg-[#00f068]" : "bg-white/30"}`}
                />
                <div>
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  <p className="text-sm text-white/50">
                    {template.timeSlotsCount} horario
                    {template.timeSlotsCount !== 1 ? "s" : ""} configurado
                    {template.timeSlotsCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-white/60">
                    {template.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={template.isActive}
                    onClick={() =>
                      handleToggleActive(template.id, template.isActive)
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      template.isActive ? "bg-[#00f068]" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        template.isActive
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>

                <Link href={`/local/schedules/edit/${template.id}`}>
                  <Button variant="secondary" className="p-3">
                    <IconEdit />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  className="p-3 text-[#ff5678] border-[#ff5678]/30 hover:bg-[#ff5678]/14"
                  onClick={() => setDeleteId(template.id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Eliminar plantilla"
        description="Esta seguro de que desea eliminar esta plantilla de horario? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </section>
  );
}
