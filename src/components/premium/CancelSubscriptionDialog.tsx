"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/Button";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  planName: string;
  nextBillingDate: string | null;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
  planName,
  nextBillingDate,
}: CancelSubscriptionDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleConfirm() {
    setIsCancelling(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsCancelling(false);
    }
  }

  const formattedDate = nextBillingDate
    ? new Date(nextBillingDate).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-destructive/15">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogTitle>Cancelar suscripción</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            ¿Estás seguro de que querés cancelar tu plan{" "}
            <span className="font-medium text-foreground">{planName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground space-y-2">
            <p>Al cancelar:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Tu plan seguirá activo hasta el fin del período pagado</li>
              <li>No se realizarán más cobros automáticos</li>
              <li>
                Al finalizar el período, tu cuenta volverá al plan Básico
              </li>
            </ul>
          </div>

          {formattedDate && (
            <p className="text-sm text-muted-foreground">
              Tu plan <span className="text-foreground font-medium">{planName}</span>{" "}
              estará activo hasta el{" "}
              <span className="text-foreground font-medium">{formattedDate}</span>.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isCancelling}
          >
            Mantener plan
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelando..." : "Cancelar suscripción"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
