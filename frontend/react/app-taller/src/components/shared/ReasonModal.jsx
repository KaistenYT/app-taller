import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

export default function ReasonModal({
  show,
  title = "Motivo de la acción",
  message,
  confirmText = "Confirmar",
  variant = "destructive", // Por defecto destructivo ya que suele ser para borrar/archivar
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setReason("");
      setError("");
    }
  }, [show]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Por favor, ingresa un motivo.");
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={show} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {message && <DialogDescription>{message}</DialogDescription>}
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-left">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Escribe el motivo de esta acción..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              className={error ? "border-destructive focus-visible:ring-destructive" : ""}
              rows={4}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            variant={variant}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
