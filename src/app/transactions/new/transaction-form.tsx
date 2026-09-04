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
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import OCRScanner from "@/components/ocr-scanner";
import { Category } from "@/types/database";
import {
  createManualTransaction,
  createCustomCategory,
} from "@/app/transactions/actions";
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

  const [categoryList, setCategoryList] = useState<Category[]>(categories);
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

  // Custom Category State
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Telemetri Riset Skripsi (Silent Ground Truth Data Collection)
  const [ocrTelemetry, setOcrTelemetry] = useState<{
    rawText: string;
    spatialAmount: number;
    spatialMerchant: string | null;
    spatialLatencyMs: number;
  } | null>(null);

  // Status visual feedback setelah scan struk berhasil
  const [ocrSuccessInfo, setOcrSuccessInfo] = useState<{
    amount: number;
    merchant: string | null;
    categoryName?: string | null;
    date?: string | null;
  } | null>(null);

  const filteredCategories = categoryList.filter((c) => c.type === type);

  function handleTypeChange(newType: "income" | "expense") {
    setType(newType);
    const matching = categoryList.filter((c) => c.type === newType);
    if (matching.length > 0) {
      setCategoryId(matching[0].id);
    }
  }

  async function handleCreateCategory(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError("Masukkan nama kategori terlebih dahulu.");
      return;
    }
    setIsSavingCategory(true);
    setCategoryError(null);
    const res = await createCustomCategory(spaceId, trimmed, type);
    setIsSavingCategory(false);

    if (res.error) {
      setCategoryError(res.error);
    } else if (res.category) {
      const created = res.category as Category;
      setCategoryList((prev) => [...prev, created]);
      setCategoryId(created.id);
      setNewCategoryName("");
      setShowAddCategory(false);
    }
  }

  function handleOCRDetected(
    detectedAmount: number,
    detectedMerchant: string | null,
    rawText: string,
    telemetry?: {
      spatialAmount: number;
      spatialMerchant: string | null;
      spatialLatencyMs: number;
    },
    suggestedCategory?: string | null,
    detectedDate?: string | null
  ) {
    if (detectedAmount > 0) {
      setAmount(detectedAmount);
    }
    if (detectedMerchant) {
      setDescription(detectedMerchant);
    }
    if (detectedDate) {
      setTransactionDate(detectedDate);
    }

    let matchedCategoryName: string | null = null;
    if (suggestedCategory) {
      // Prioritaskan kategori pengeluaran (karena struk transaksi ritel/resto adalah expense)
      const targetList = categoryList.filter((c) => c.type === "expense");
      const lower = suggestedCategory.toLowerCase();

      // Cocokkan nama kategori berdasarkan kesamaan teks atau kata kunci utama
      const matched = targetList.find((c) => {
        const cLower = c.name.toLowerCase();
        return (
          cLower === lower ||
          lower.includes(cLower) ||
          cLower.includes(lower) ||
          (lower.includes("makan") && (cLower.includes("makan") || cLower.includes("kuliner"))) ||
          (lower.includes("dapur") && (cLower.includes("belanja") || cLower.includes("dapur"))) ||
          (lower.includes("transpor") && cLower.includes("transpor")) ||
          (lower.includes("obat") && (cLower.includes("obat") || cLower.includes("sehat"))) ||
          (lower.includes("tagih") && (cLower.includes("tagih") || cLower.includes("utilitas"))) ||
          (lower.includes("hibur") && (cLower.includes("hibur") || cLower.includes("kencan"))) ||
          (lower.includes("buku") && (cLower.includes("pendidikan") || cLower.includes("buku")))
        );
      });

      if (matched) {
        setType("expense");
        setCategoryId(matched.id);
        matchedCategoryName = matched.name;
      }
    }

    setSource("ocr");
    if (telemetry) {
      setOcrTelemetry({
        rawText,
        spatialAmount: telemetry.spatialAmount,
        spatialMerchant: telemetry.spatialMerchant,
        spatialLatencyMs: telemetry.spatialLatencyMs,
      });
    }

    setOcrSuccessInfo({
      amount: detectedAmount,
      merchant: detectedMerchant,
      categoryName: matchedCategoryName,
      date: detectedDate,
    });

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

    // Kirim data telemetri riset jika bersumber dari scan OCR (diproses di latar belakang server)
    if (source === "ocr" && ocrTelemetry) {
      formData.append("rawText", ocrTelemetry.rawText);
      formData.append("spatialAmount", ocrTelemetry.spatialAmount.toString());
      formData.append("spatialMerchant", ocrTelemetry.spatialMerchant || "");
      formData.append("spatialLatencyMs", ocrTelemetry.spatialLatencyMs.toString());
    }

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
      <div
        role="group"
        aria-label="Pilih jenis catatan"
        className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#F7F4EE] border border-warm-border select-none"
      >
        <button
          type="button"
          aria-pressed={type === "expense"}
          onClick={() => handleTypeChange("expense")}
          className={`min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border ${
            type === "expense"
              ? "bg-[#FF7E7E] border-rose-300 text-white shadow-sm"
              : "border-transparent text-stone-600 hover:text-stone-900"
          }`}
        >
          <TrendingDown className="w-4 h-4" aria-hidden="true" />
          Pengeluaran
        </button>

        <button
          type="button"
          aria-pressed={type === "income"}
          onClick={() => handleTypeChange("income")}
          className={`min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border ${
            type === "income"
              ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
              : "border-transparent text-stone-600 hover:text-stone-900"
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
          className="w-full p-3.5 rounded-2xl bg-white border border-warm-border flex items-center justify-between text-left group transition hover:border-warm-apricot shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FFF9EC] border border-amber-100 text-orange-600 shrink-0">
              <ScanLine className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-warm-espresso">
                Pindai Foto Nota / Struk Belanja
              </p>
              <p className="text-[11px] text-stone-500">
                Nominal, toko, dan tanggal otomatis terisi
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-600 group-hover:translate-x-0.5 transition">
            Buka &rarr;
          </span>
        </button>
      ) : (
        <OCRScanner
          onDetected={handleOCRDetected}
          onCancel={() => setShowOCR(false)}
        />
      )}

      {/* Visual Feedback: Hasil Scan OCR Berhasil Terisi */}
      {ocrSuccessInfo && !showOCR && (
        <div className="p-3 rounded-2xl bg-[#FFF9EC] border border-amber-200 text-xs text-stone-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-orange-600 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold text-warm-espresso">
                Data Nota Berhasil Terbaca
              </p>
              <p className="text-[11px] text-stone-600 mt-0.5 font-medium">
                {ocrSuccessInfo.amount > 0 && <>Rp {ocrSuccessInfo.amount.toLocaleString("id-ID")}</>}
                {ocrSuccessInfo.merchant && <> · {ocrSuccessInfo.merchant}</>}
                {ocrSuccessInfo.categoryName && <> · {ocrSuccessInfo.categoryName}</>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOcrSuccessInfo(null)}
            className="p-1 text-stone-400 hover:text-stone-700"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CurrencyInput */}
        <CurrencyInput
          id="transaction-amount"
          name="amount"
          label="Nominal Belanja"
          value={amount}
          onChange={(val) => setAmount(val)}
          required
        />

        {/* Kategori Dropdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="transaction-category"
              className="block text-xs font-semibold text-warm-espresso select-none"
            >
              Kategori
            </label>
            <button
              type="button"
              onClick={() => {
                setShowAddCategory(!showAddCategory);
                setCategoryError(null);
              }}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition"
            >
              {showAddCategory ? (
                <>
                  <X className="w-3 h-3" />
                  Batal
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Kategori Baru
                </>
              )}
            </button>
          </div>

          {showAddCategory ? (
            <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-warm-border space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-warm-espresso">
                  Tambah Kategori {type === "expense" ? "Pengeluaran" : "Pemasukan"}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  Khusus celengan berdua
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={50}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Misal: Skincare, Kopi, Jajan..."
                  className="flex-1 h-10 px-3 rounded-xl border border-warm-border bg-white text-xs text-warm-espresso placeholder-stone-400 focus:outline-none focus:border-warm-apricot"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCategory(e);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  isLoading={isSavingCategory}
                  onClick={() => handleCreateCategory()}
                  className="h-10 px-3.5 text-xs shrink-0 rounded-xl"
                >
                  Simpan
                </Button>
              </div>
              {categoryError && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {categoryError}
                </p>
              )}
            </div>
          ) : (
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" aria-hidden="true" />
              <select
                id="transaction-category"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-warm-border bg-white text-sm text-warm-espresso focus:outline-none focus:border-warm-apricot shadow-2xs"
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {!cat.is_system ? " (Kustom)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Deskripsi / Keterangan */}
        <div className="space-y-1.5">
          <label
            htmlFor="transaction-description"
            className="block text-xs font-semibold text-warm-espresso select-none"
          >
            Nama Toko / Keperluan
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" aria-hidden="true" />
            <input
              id="transaction-description"
              type="text"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Belanja Bulanan di Supermarket"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-warm-border bg-white text-sm text-warm-espresso placeholder-stone-400 focus:outline-none focus:border-warm-apricot shadow-2xs"
            />
          </div>
        </div>

        {/* Tanggal & Waktu */}
        <div className="space-y-1.5">
          <label
            htmlFor="transaction-date"
            className="block text-xs font-semibold text-warm-espresso select-none"
          >
            Tanggal & Waktu Belanja
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" aria-hidden="true" />
            <input
              id="transaction-date"
              type="datetime-local"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-warm-border bg-white text-sm text-warm-espresso focus:outline-none focus:border-warm-apricot shadow-2xs [color-scheme:light]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant={type === "expense" ? "destructive" : "primary"}
          isLoading={isPending}
          loadingText="Menyimpan Catatan..."
          className="w-full text-sm font-bold mt-2"
        >
          <Check className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Simpan {type === "expense" ? "Pengeluaran" : "Pemasukan"}
        </Button>
      </form>
    </div>
  );
}
