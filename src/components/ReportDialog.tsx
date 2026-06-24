"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { TextareaField, SelectField } from "@/components/Field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

  function resetForm() {
    setReason(ReportReason.INAPPROPRIATE_CONTENT);
    setDescription("");
    setError(null);
    setDescriptionErrors([]);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleOpenChange(open: boolean) {
    if (!open) handleClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Reportar local</DialogTitle>
          <DialogDescription>
            Estas a punto de reportar a <strong>{localName}</strong>. Tu reporte
            sera revisado por nuestro equipo.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
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

          <p className="text-sm text-muted-foreground text-right">
            {description.length}/500
          </p>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <DialogFooter className="gap-2 pt-2 sm:gap-3">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
