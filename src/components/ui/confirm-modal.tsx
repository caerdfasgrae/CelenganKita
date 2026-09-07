"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "destructive",
  isLoading = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-white border-t sm:border border-warm-border p-5 pb-safe sm:pb-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-stone-200 mx-auto -mt-1 mb-2 sm:hidden" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl shrink-0 border ${
                variant === "destructive"
                  ? "bg-rose-50 border-rose-200 text-warm-coral"
                  : "bg-amber-50 border-amber-200 text-warm-apricot"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 id="confirm-modal-title" className="text-sm font-bold text-warm-espresso">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition active:scale-95"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p id="confirm-modal-desc" className="text-xs text-stone-600 leading-relaxed">
          {description}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full min-h-[46px] rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            {cancelText}
          </Button>

          <Button
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="w-full min-h-[46px] rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
