import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

export default function ConfirmModal({
  show,
  title = "Confirmación",
  message,
  detail,
  confirmText = "Sí, confirmar",
  cancelText = "Cancelar",
  variant = "primary",
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={show} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        {detail && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            {detail}
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === "danger" ? "destructive" : "default"} 
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
