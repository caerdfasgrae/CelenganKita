"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@/types/database";
import {
  validateQuickInput,
  QuickInputValidation,
  ParsedQuickExpense,
} from "@/lib/quick-parser";
import { createManualTransaction } from "@/app/transactions/actions";
import { formatRupiah, getWIBDateTimeLocal } from "@/lib/utils";
import Link from "next/link";
import {
  Send,
  Sparkles,
  Check,
  X,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Camera,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface QuickExpenseBarProps {
  spaceId: string;
  categories: Category[];
}

export function QuickExpenseBar({ spaceId, categories }: QuickExpenseBarProps) {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed draft state inside the bottom sheet
  const [draftAmount, setDraftAmount] = useState<number>(0);
  const [draftDescription, setDraftDescription] = useState<string>("");
  const [draftType, setDraftType] = useState<"income" | "expense">("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [draftDate, setDraftDate] = useState<string>("");

  // Live parsing and guardrail validation for instant feedback as user types
  const liveValidation = useMemo<QuickInputValidation>(() => {
    return validateQuickInput(inputText, categories);
  }, [inputText, categories]);

  const liveParsed = liveValidation.parsed;

  // Handle ESC key to close bottom sheet
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isSheetOpen) {
        setIsSheetOpen(false);
      }
    }
    if (isSheetOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isSheetOpen]);

  function handleOpenSheet(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!liveParsed) return;

    setDraftAmount(liveParsed.amount);
    setDraftDescription(liveParsed.description);
    setDraftType(liveParsed.type);
    setSelectedCategoryId(liveParsed.suggestedCategoryId);
    setDraftDate(liveParsed.transactionDate || getWIBDateTimeLocal());
    setErrorMessage(null);
    setIsSheetOpen(true);
  }

  async function handleSaveTransaction() {
    if (draftAmount <= 0) {
      setErrorMessage("Nominal harus lebih dari Rp 0.");
      return;
    }
    if (!selectedCategoryId) {
      setErrorMessage("Silakan pilih kategori transaksi.");
      return;
    }

    const formData = new FormData();
    formData.append("spaceId", spaceId);
    formData.append("categoryId", selectedCategoryId);
    formData.append("type", draftType);
    formData.append("amount", draftAmount.toString());
    formData.append("description", draftDescription.trim() || "Catatan cepat");
    formData.append("transactionDate", draftDate || getWIBDateTimeLocal());
    formData.append("source", "manual");

    startTransition(async () => {
      const res = await createManualTransaction(formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setIsSheetOpen(false);
        setInputText("");
        setSuccessMessage(
          `Tersimpan: ${formatRupiah(draftAmount)} untuk ${draftDescription || "belanjaan"}`
        );
        router.refresh();

        // Auto hide success banner after 4 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 4000);
      }
    });
  }

  const filteredCategories = categories.filter((c) => c.type === draftType);

  return (
    <div className="space-y-2 select-none">
      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span className="font-bold truncate">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-stone-400 hover:text-stone-600 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg"
            aria-label="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Single-Line Quick Input Bar */}
      <section
        aria-label="Fitur Catat Cepat"
        className="p-3 sm:p-3.5 rounded-2xl bg-white border border-warm-border shadow-2xs"
      >
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="quick-expense-input"
            className="text-xs font-black text-warm-espresso flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-warm-apricot inline-block" />
            Catat Cepat
          </label>
          <span className="text-[10px] text-stone-500 font-medium">
            Ketik instan atau foto nota
          </span>
        </div>

        <form onSubmit={handleOpenSheet} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="quick-expense-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Contoh: Kopi 25rb atau Bensin 50k..."
              className="w-full min-h-[46px] pl-3.5 pr-9 text-xs sm:text-sm font-medium bg-stone-50/70 border border-warm-border rounded-xl text-warm-espresso placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-warm-apricot focus:ring-1 focus:ring-warm-apricot transition"
              autoComplete="off"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText("")}
                aria-label="Hapus teks input"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Link
            href="/transactions/new?mode=ocr"
            aria-label="Foto struk nota kasir"
            title="Foto struk nota kasir"
            className="min-w-[46px] min-h-[46px] rounded-xl flex items-center justify-center bg-stone-50 hover:bg-amber-50 hover:text-orange-600 text-stone-600 border border-warm-border transition-all duration-75 active:scale-95 shadow-2xs shrink-0"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
          </Link>

          <button
            type="submit"
            disabled={!liveParsed}
            aria-label="Periksa dan simpan belanjaan"
            className={`min-w-[46px] min-h-[46px] rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-75 active:scale-95 shadow-2xs shrink-0 ${
              liveParsed
                ? "bg-warm-apricot hover:bg-orange-500 text-stone-900 border border-orange-300 cursor-pointer"
                : "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        {/* Live Helper & Guardrail Warning Feedback */}
        {inputText.trim().length > 0 && !liveParsed && (
          <div className="mt-2 text-xs flex items-center gap-1.5 animate-in fade-in duration-150">
            {liveValidation.status === "security_blocked" ||
            liveValidation.status === "amount_exceeded" ? (
              <div
                role="alert"
                className="flex items-center gap-1.5 text-rose-600 font-bold text-[11px]"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{liveValidation.message}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-stone-500 font-medium text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                <span>{liveValidation.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Live Detected Preview Pill */}
        {liveParsed && (
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-warm-border/60">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                {liveParsed.type === "income" ? "+ Masuk" : "- Belanja"}
              </span>
              {liveParsed.matchedDateLabel && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 shrink-0 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-500" aria-hidden="true" />
                  {liveParsed.matchedDateLabel}
                </span>
              )}
              <span className="text-xs font-black text-warm-espresso truncate">
                {formatRupiah(liveParsed.amount)}
              </span>
              <span className="text-[11px] text-stone-500 truncate">
                {liveParsed.description}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenSheet()}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline shrink-0 min-h-[44px] px-2 flex items-center"
            >
              Simpan →
            </button>
          </div>
        )}
      </section>

      {/* Ergonomic Mobile Bottom Sheet for Confirmation */}
      {isSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-sheet-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150 p-0 sm:p-4"
        >
          {/* Backdrop Click */}
          <div
            className="fixed inset-0"
            onClick={() => !isPending && setIsSheetOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Modal Container */}
          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-warm-border p-5 pb-safe space-y-4 shadow-2xl z-10 animate-in slide-in-from-bottom-5 duration-200">
            {/* Top Pull Indicator Bar */}
            <div className="flex justify-center -mt-2 mb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-stone-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-warm-border pb-3">
              <div>
                <h2
                  id="quick-sheet-title"
                  className="text-base font-black text-warm-espresso"
                >
                  Konfirmasi Catatan Cepat
                </h2>
                <p className="text-[11px] text-stone-500 font-medium">
                  Pastikan nominal dan kategori sudah pas sebelum masuk kas bersama.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                disabled={isPending}
                className="w-8 h-8 rounded-xl text-stone-400 hover:text-stone-700 flex items-center justify-center"
                aria-label="Tutup jendela"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
              >
                {errorMessage}
              </div>
            )}

            {/* Type Switcher (Pengeluaran vs Pemasukan) */}
            <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setDraftType("expense")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  draftType === "expense"
                    ? "bg-white text-rose-700 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setDraftType("income")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  draftType === "income"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Pemasukan
              </button>
            </div>

            {/* Nominal Field */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Nominal Transaksi
              </span>
              <span className="text-2xl font-black text-warm-espresso tabular-nums tracking-tight block mt-0.5">
                {formatRupiah(draftAmount)}
              </span>
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor="quick-desc-input"
                className="text-xs font-bold text-stone-700 block mb-1"
              >
                Nama Catatan / Keterangan
              </label>
              <input
                id="quick-desc-input"
                type="text"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                className="w-full min-h-[44px] px-3 text-xs sm:text-sm font-medium bg-white border border-warm-border rounded-xl text-warm-espresso focus:outline-none focus:border-warm-apricot focus:ring-1 focus:ring-warm-apricot"
              />
            </div>

            {/* Date & Time Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="quick-date-input"
                  className="text-xs font-bold text-stone-700 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
                  Tanggal & Waktu Transaksi
                </label>
                {liveParsed?.matchedDateLabel && (
                  <span className="text-[10px] text-orange-700 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    ✨ {liveParsed.matchedDateLabel}
                  </span>
                )}
              </div>
              <input
                id="quick-date-input"
                type="datetime-local"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="w-full min-h-[44px] px-3 text-xs sm:text-sm font-medium bg-white border border-warm-border rounded-xl text-warm-espresso focus:outline-none focus:border-warm-apricot focus:ring-1 focus:ring-warm-apricot"
              />
            </div>

            {/* Category Selection Chips */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Kategori Bersama
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 border ${
                        isSelected
                          ? "bg-amber-100 border-amber-400 text-stone-900 shadow-2xs"
                          : "bg-white border-warm-border text-stone-600 hover:border-warm-apricot"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-orange-700" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleSaveTransaction}
                disabled={isPending}
                className="w-full min-h-[46px] rounded-xl bg-warm-apricot hover:bg-orange-500 text-stone-900 font-extrabold text-sm border border-orange-300 shadow-sm transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? "Menyimpan ke Kas..." : "Simpan ke Kas Bersama 💕"}
              </button>

              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                disabled={isPending}
                className="w-full min-h-[44px] rounded-xl bg-white hover:bg-stone-50 text-stone-600 font-bold text-xs border border-warm-border transition active:scale-95 flex items-center justify-center"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
