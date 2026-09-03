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
  DollarSign,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import OCRScanner from "@/components/ocr-scanner";
import { Category } from "@/types/database";
import { createManualTransaction } from "@/app/transactions/actions";

interface TransactionFormProps {
  spaceId: string;
  categories: Category[];
}

export default function TransactionForm({ spaceId, categories }: TransactionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode");

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [showOCR, setShowOCR] = useState<boolean>(initialMode === "ocr");
  const [source, setSource] = useState<"manual" | "ocr">("manual");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter categories by type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Set default category jika belum dipilih
  if (!categoryId && filteredCategories.length > 0) {
    setCategoryId(filteredCategories[0].id);
  }

  function handleOCRDetected(
    detectedAmount: number,
    detectedMerchant: string | null,
    rawText: string
  ) {
    if (detectedAmount > 0) {
      setAmount(detectedAmount.toString());
    }
    if (detectedMerchant) {
      setDescription(detectedMerchant);
    }
    setSource("ocr");
    setShowOCR(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("spaceId", spaceId);
    formData.append("type", type);
    formData.append("amount", amount);
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
      {/* Type Toggle: Pengeluaran vs Pemasukan */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => {
            setType("expense");
            const expCats = categories.filter((c) => c.type === "expense");
            if (expCats.length > 0) setCategoryId(expCats[0].id);
          }}
          className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            type === "expense"
              ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Pengeluaran
        </button>

        <button
          type="button"
          onClick={() => {
            setType("income");
            const incCats = categories.filter((c) => c.type === "income");
            if (incCats.length > 0) setCategoryId(incCats[0].id);
          }}
          className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            type === "income"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Pemasukan
        </button>
      </div>

      {/* OCR Scanner Toggle Banner */}
      {!showOCR ? (
        <button
          type="button"
          onClick={() => setShowOCR(true)}
          className="w-full p-3 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between text-left group transition hover:opacity-90"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-sm">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                Scan Struk / Screenshot Galeri (OCR)
              </p>
              <p className="text-[10px] text-teal-700 dark:text-teal-400">
                Nominal & nama toko otomatis terisi di form
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
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nominal Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Nominal Transaksi (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
              Rp
            </span>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Kategori Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Kategori
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Deskripsi / Toko / Merchant
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Belanja Sayur di Indomaret"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Tanggal & Waktu */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tanggal & Waktu
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="datetime-local"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 ${
            type === "expense"
              ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/30"
              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
          }`}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan Transaksi...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Simpan {type === "expense" ? "Pengeluaran" : "Pemasukan"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
