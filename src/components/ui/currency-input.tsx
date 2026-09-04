"use client";

import React, { useState, useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, RotateCcw } from "lucide-react";

export interface CurrencyInputProps {
  label?: string;
  name?: string;
  id?: string;
  value?: number | string;
  onChange?: (val: number) => void;
  error?: string | null;
  placeholder?: string;
  required?: boolean;
  className?: string;
  showQuickChips?: boolean;
}

export function CurrencyInput({
  label = "Nominal Transaksi",
  name = "amount",
  id: customId,
  value,
  onChange,
  error,
  placeholder = "0",
  required = true,
  className,
  showQuickChips = true,
}: CurrencyInputProps) {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = `${inputId}-error`;

  // Numeric value murni di state (Domain value)
  const [numericValue, setNumericValue] = useState<number>(() => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  });

  // Sync saat prop value berubah dari luar (misal hasil OCR)
  useEffect(() => {
    if (value !== undefined) {
      const parsed = typeof value === "number" ? value : parseFloat(value);
      const safeVal = isNaN(parsed) ? 0 : parsed;
      setNumericValue(safeVal);
    }
  }, [value]);

  // Format visual untuk tampilan display UI
  function formatDisplay(num: number): string {
    if (num <= 0) return "";
    return new Intl.NumberFormat("id-ID").format(num);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Hapus semua karakter non-angka
    const cleanDigits = e.target.value.replace(/[^0-9]/g, "");
    const parsed = cleanDigits ? parseInt(cleanDigits, 10) : 0;

    // Batasi maksimum angka wajar (1 Triliun)
    const capped = Math.min(parsed, 1_000_000_000_000);
    setNumericValue(capped);
    onChange?.(capped);
  }

  function addQuickAmount(addValue: number) {
    const updated = Math.min(numericValue + addValue, 1_000_000_000_000);
    setNumericValue(updated);
    onChange?.(updated);
  }

  function handleReset() {
    setNumericValue(0);
    onChange?.(0);
  }

  const quickChips = [
    { label: "+10rb", value: 10_000 },
    { label: "+50rb", value: 50_000 },
    { label: "+100rb", value: 100_000 },
    { label: "+500rb", value: 500_000 },
  ];

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
        >
          {label}
        </label>
      )}

      {/* Input Display UI */}
      <div className="relative">
        <span
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 dark:text-slate-500 pointer-events-none select-none"
          aria-hidden="true"
        >
          Rp
        </span>

        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          required={required}
          value={formatDisplay(numericValue)}
          onChange={handleInputChange}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full h-12 pl-11 pr-10 text-lg font-black tracking-tight rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition",
            "border-slate-200 dark:border-slate-700",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900",
            error && "border-rose-500 focus:ring-rose-500",
            className
          )}
        />

        {numericValue > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Reset nominal"
            aria-label="Reset nominal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nilai numerik murni yang dikirimkan form ke Server Action */}
      <input type="hidden" name={name} value={numericValue} />

      {/* Quick Add Chips (Ramah Jempol di HP) */}
      {showQuickChips && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          {quickChips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => addQuickAmount(chip.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 hover:border-emerald-300 transition shrink-0 active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
