"use client";

import { useState, useTransition } from "react";
import { Check, X, Edit3, AlertCircle, Sparkles } from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { Category, PendingValidation } from "@/types/database";
import { approveValidation, rejectValidation } from "@/app/validations/actions";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface ValidationItemProps {
  item: PendingValidation;
  categories: Category[];
}

export default function ValidationItem({ item, categories }: ValidationItemProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const matchingCategories = categories.filter((c) => c.type === item.parsed_type);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    item.suggested_category_id || matchingCategories[0]?.id || ""
  );
  const [amount, setAmount] = useState<number>(item.parsed_amount || 0);
  const [description, setDescription] = useState<string>(
    item.parsed_merchant || `${item.source_app} - Notifikasi Otomatis`
  );
  const [error, setError] = useState<string | null>(null);

  const isExpense = item.parsed_type === "expense";

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveValidation(
        item.id,
        selectedCategory,
        amount,
        description
      );
      if (res?.error) setError(res.error);
    });
  }

  function handleConfirmReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectValidation(item.id);
      if (res?.error) setError(res.error);
      setShowRejectModal(false);
    });
  }

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
      {/* Top row: Source app badge, Status "Belum Masuk Buku Kas", & Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
            {item.source_app}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {formatTanggal(item.created_at)}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
            isExpense
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
          }`}
        >
          {isExpense ? "Pengeluaran" : "Pemasukan"}
        </span>
      </div>

      {/* Trust Reminder: Belum masuk buku kas resmi */}
      <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900/50">
        <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span>Perlu Konfirmasi: Belum tercatat di buku kas resmi Anda.</span>
      </div>

      {/* Raw Text snippet preview */}
      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2">
        &ldquo;{item.raw_text}&rdquo;
      </div>

      {error && (
        <div role="alert" className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Parsed Info or Edit Mode */}
      {isEditing ? (
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700">
          <div>
            <label htmlFor={`edit-amount-${item.id}`} className="block text-[10px] font-semibold text-slate-500">
              Nominal Transaksi (Rp)
            </label>
            <input
              id={`edit-amount-${item.id}`}
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor={`edit-desc-${item.id}`} className="block text-[10px] font-semibold text-slate-500">
              Keterangan / Merchant
            </label>
            <input
              id={`edit-desc-${item.id}`}
              type="text"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[11px] font-bold text-emerald-600 hover:underline pt-0.5"
          >
            Selesai Edit
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(amount)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[240px]">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Edit nominal atau catatan notifikasi"
            className="w-10 h-10 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category selector & Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <label htmlFor={`cat-select-${item.id}`} className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
            Kategori:
          </label>
          <select
            id={`cat-select-${item.id}`}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {matchingCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons: Setuju vs Tolak (Touch targets >= 44px) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setShowRejectModal(true)}
            className="w-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <X className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Tolak
          </Button>

          <Button
            variant="primary"
            isLoading={isPending}
            loadingText="Mencatat..."
            onClick={handleApprove}
            className="w-full text-xs font-bold"
          >
            <Check className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Setuju Catat
          </Button>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Penolakan Notifikasi */}
      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleConfirmReject}
        isLoading={isPending}
        title="Tolak Notifikasi Ini?"
        description={`Apakah Anda yakin ingin menolak transaksi dari ${item.source_app} sebesar ${formatRupiah(amount)}? Data ini akan dikeluarkan dari antrean validasi dan tidak akan dicatat ke saldo kas.`}
        confirmText="Tolak & Buang"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
