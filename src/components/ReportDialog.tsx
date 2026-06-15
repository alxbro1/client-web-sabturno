"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { TextareaField, SelectField } from "@/components/Field";
import {
  ReportReason,
  REPORT_REASON_LABELS,
} from "@/lib/types/report";
import { useMyReportsQuery } from "@/hooks/queries/useReportsQuery";

interface ReportDialogProps {
  isOpen: boolean;
  localId: string;
  localName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReportDialog({
  isOpen,
  localId,
  localName,
  onClose,
  onSuccess,
}: ReportDialogProps) {
  const { createReport, isCreating } = useMyReportsQuery();

  const [reason, setReason] = useState<ReportReason>(
    ReportReason.INAPPROPRIATE_CONTENT,
  );
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [descriptionErrors, setDescriptionErrors] = useState<string[]>([]);

  function validateDescription(value: string): string[] {
    const errors: string[] = [];
    if (value.trim().length < 10) {
      errors.push("La descripcion debe tener al menos 10 caracteres");
    }
    if (value.length > 500) {
      errors.push("La descripcion no puede exceder 500 caracteres");
    }
    return errors;
  }

  function handleDescriptionChange(value: string) {
    setDescription(value);
    setDescriptionErrors(validateDescription(value));
  }

  const isFormValid =
    description.trim().length >= 10 &&
    description.length <= 500 &&
    descriptionErrors.length === 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFormValid) return;

    setError(null);

    try {
      await createReport({
        localId,
        reason,
        description: description.trim(),
      });
      onSuccess?.();
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(message || "No se pudo enviar el reporte. Intenta nuevamente.");
    }
  }

  function handleClose() {
    setReason(ReportReason.INAPPROPRIATE_CONTENT);
    setDescription("");
    setError(null);
    setDescriptionErrors([]);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#0d0f12] p-6 shadow-[0_24px_65px_rgba(0,0,0,0.5)]">
        <h2 className="text-[1.25rem] font-bold mb-2">Reportar local</h2>
        <p className="text-white/54 text-[0.9rem] mb-6">
          Estas a punto de reportar a <strong>{localName}</strong>. Tu reporte
          sera revisado por nuestro equipo.
        </p>

        <form className="grid gap-[1.1rem]" onSubmit={handleSubmit}>
          <SelectField
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
          >
            {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>

          <TextareaField
            label="Descripcion"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            errors={descriptionErrors}
            hint="Explica el motivo del reporte (minimo 10 caracteres)"
          />

          <p className="text-[0.78rem] text-white/36 text-right">
            {description.length}/500
          </p>

          {error ? (
            <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={handleClose}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!isFormValid || isCreating}
              fullWidth
            >
              {isCreating ? "Enviando..." : "Enviar reporte"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
