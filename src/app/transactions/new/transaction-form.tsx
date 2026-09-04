"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingDown,
  TrendingUp,
  ScanLine,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  Check,
} from "lucide-react";
import OCRScanner from "@/components/ocr-scanner";
import { Category } from "@/types/database";
import { createManualTransaction } from "@/app/transactions/actions";
import { getWIBDateTimeLocal } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";

interface TransactionFormProps {
  spaceId: string;
  categories: Category[];
}

export default function TransactionForm({ spaceId, categories }: TransactionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode");

  const [type, setType] = useState<"income" | "expense">("expense");

  // Inisialisasi categoryId secara aman tanpa setState saat render
  const [categoryId, setCategoryId] = useState<string>(() => {
    const defaultCats = categories.filter((c) => c.type === "expense");
    return defaultCats[0]?.id || categories[0]?.id || "";
  });

  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(() => getWIBDateTimeLocal());
  const [showOCR, setShowOCR] = useState<boolean>(initialMode === "ocr");
  const [source, setSource] = useState<"manual" | "ocr">("manual");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredCategories = categories.filter((c) => c.type === type);

  function handleTypeChange(newType: "income" | "expense") {
    setType(newType);
    const matching = categories.filter((c) => c.type === newType);
    if (matching.length > 0) {
      setCategoryId(matching[0].id);
    }
  }

  function handleOCRDetected(
    detectedAmount: number,
    detectedMerchant: string | null,
    rawText: string
  ) {
    if (detectedAmount > 0) {
      setAmount(detectedAmount);
    }
    if (detectedMerchant) {
      setDescription(detectedMerchant);
    }
    setSource("ocr");
    setShowOCR(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setError(null);

    if (amount <= 0) {
      setError("Nominal transaksi harus lebih besar dari Rp 0.");
      return;
    }

    if (!categoryId) {
      setError("Silakan pilih kategori transaksi.");
      return;
    }

    const formData = new FormData();
    formData.append("spaceId", spaceId);
    formData.append("type", type);
    // Kirim domain value murni numerik ke server action
    formData.append("amount", amount.toString());
    formData.append("categoryId", categoryId);
    formData.append("description", description);
    formData.append("transactionDate", transactionDate);
    formData.append("source", source);

    startTransition(async () => {
      const res = await createManualTransaction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/dashboard");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Type Toggle: Pengeluaran vs Pemasukan (Normalisasi rounded-lg) */}
      <div
        role="group"
        aria-label="Pilih jenis transaksi"
        className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 select-none"
      >
        <button
          type="button"
          aria-pressed={type === "expense"}
          onClick={() => handleTypeChange("expense")}
          className={`min-h-[44px] rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
            type === "expense"
              ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <TrendingDown className="w-4 h-4" aria-hidden="true" />
          Pengeluaran
        </button>

        <button
          type="button"
          aria-pressed={type === "income"}
          onClick={() => handleTypeChange("income")}
          className={`min-h-[44px] rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
            type === "income"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
          Pemasukan
        </button>
      </div>

      {/* OCR Scanner Toggle Banner */}
      {!showOCR ? (
        <button
          type="button"
          onClick={() => setShowOCR(true)}
          className="w-full p-3 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between text-left group transition hover:opacity-95"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-600 text-white shadow-xs">
              <ScanLine className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                Scan Struk / Screenshot Galeri (OCR)
              </p>
              <p className="text-[10px] text-teal-700 dark:text-teal-400">
                Nominal & nama toko terisi otomatis
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition">
            Buka &rarr;
          </span>
        </button>
      ) : (
        <OCRScanner
          onDetected={handleOCRDetected}
          onCancel={() => setShowOCR(false)}
        />
      )}

      {error && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CurrencyInput: Domain value numerik murni terpisah dari display */}
        <CurrencyInput
          id="transaction-amount"
          name="amount"
          label="Nominal Transaksi"
          value={amount}
          onChange={(val) => setAmount(val)}
          required
        />

        {/* Kategori Dropdown dengan Label Terhubung */}
        <div className="space-y-1.5">
          <label
            htmlFor="transaction-category"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
          >
            Kategori
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
            <select
              id="transaction-category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deskripsi / Keterangan */}
        <div className="space-y-1.5">
          <label
            htmlFor="transaction-description"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
          >
            Deskripsi / Toko / Merchant
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              id="transaction-description"
              type="text"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Belanja Sayur di Pasar"
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Tanggal & Waktu */}
        <div className="space-y-1.5">
          <label
            htmlFor="transaction-date"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
          >
            Tanggal & Waktu Transaksi
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              id="transaction-date"
              type="datetime-local"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Submit Button (Aksesibel, min-h 44px, proteksi double-submit) */}
        <Button
          type="submit"
          variant={type === "expense" ? "destructive" : "primary"}
          isLoading={isPending}
          loadingText="Menyimpan Transaksi..."
          className="w-full text-sm font-bold shadow-md mt-2"
        >
          <Check className="w-4 h-4 mr-1" aria-hidden="true" />
          Simpan {type === "expense" ? "Pengeluaran" : "Pemasukan"}
        </Button>
      </form>
    </div>
  );
}
