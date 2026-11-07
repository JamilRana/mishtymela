"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmText,
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  loading = false,
  onConfirm,
}) => {
  const actualConfirmLabel = confirmLabel || confirmText || "Confirm";
  const actualLoading = isLoading || loading;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 animate-in fade-in duration-150" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg p-6 shadow-xl border border-slate-200 z-50 animate-in zoom-in-95 duration-150 focus:outline-none">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "p-2.5 rounded-full shrink-0",
                variant === "danger"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-blue-100 text-blue-600"
              )}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-base font-semibold text-slate-900">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="text-slate-400 hover:text-slate-600 p-1 rounded-sm"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={actualLoading}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={actualLoading}
              onClick={async () => {
                await onConfirm();
                onOpenChange(false);
              }}
              className={cn(
                "px-4 py-2 text-sm font-medium text-white rounded-md shadow-xs focus:ring-2 focus:ring-offset-1 focus:outline-none transition-colors",
                variant === "danger"
                  ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
                actualLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {actualLoading ? "Processing..." : actualConfirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
