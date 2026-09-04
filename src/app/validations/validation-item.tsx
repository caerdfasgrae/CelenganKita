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
    <div className="p-4 rounded-2xl bg-white border border-warm-border space-y-3 shadow-xs">
      {/* Top row: Source app badge & Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-lg bg-[#FFF9EC] border border-amber-200 text-stone-800 font-bold text-[11px]">
            {item.source_app}
          </span>
          <span className="text-[11px] text-stone-500">
            {formatTanggal(item.created_at)}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${
            isExpense
              ? "bg-rose-50 border-rose-200 text-warm-coral"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {isExpense ? "Pengeluaran" : "Pemasukan"}
        </span>
      </div>

      {/* Trust Reminder */}
      <div className="flex items-center gap-1.5 text-[11px] text-stone-700 font-medium bg-[#FFF9EC] px-2.5 py-1.5 rounded-xl border border-amber-200">
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-orange-600" aria-hidden="true" />
        <span>Perlu dicek: Belum dimasukkan ke catatan kas bersama.</span>
      </div>

      {/* Raw Text snippet preview */}
      <div className="p-2.5 rounded-xl bg-[#FBF8F2] border border-warm-border text-[11px] text-stone-600 italic line-clamp-2">
        &ldquo;{item.raw_text}&rdquo;
      </div>

      {error && (
        <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Parsed Info or Edit Mode */}
      {isEditing ? (
        <div className="space-y-2.5 pt-1 border-t border-warm-border">
          <div>
            <label htmlFor={`edit-amount-${item.id}`} className="block text-[11px] font-semibold text-warm-espresso mb-1">
              Nominal Belanja (Rp)
            </label>
            <input
              id={`edit-amount-${item.id}`}
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-warm-border bg-white text-xs font-bold text-warm-espresso focus:outline-none focus:border-warm-apricot"
            />
          </div>
          <div>
            <label htmlFor={`edit-desc-${item.id}`} className="block text-[11px] font-semibold text-warm-espresso mb-1">
              Nama Toko / Keperluan
            </label>
            <input
              id={`edit-desc-${item.id}`}
              type="text"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-warm-border bg-white text-xs text-warm-espresso focus:outline-none focus:border-warm-apricot"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 pt-0.5"
          >
            Selesai Edit
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-base font-black text-warm-espresso tracking-tight tabular-nums">
              {formatRupiah(amount)}
            </p>
            <p className="text-xs text-stone-600 font-medium truncate max-w-[240px] mt-0.5">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Edit nominal atau catatan notifikasi"
            className="w-9 h-9 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition flex items-center justify-center border border-warm-border shadow-2xs"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category selector & Action Buttons */}
      <div className="space-y-2.5 pt-2 border-t border-warm-border">
        <div className="flex items-center gap-2">
          <label htmlFor={`cat-select-${item.id}`} className="text-[11px] font-semibold text-warm-espresso shrink-0">
            Kategori:
          </label>
          <select
            id={`cat-select-${item.id}`}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 h-10 px-3 rounded-xl border border-warm-border bg-white text-xs font-semibold text-warm-espresso focus:outline-none focus:border-warm-apricot shadow-2xs"
          >
            {matchingCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons: Masukkan ke Kas vs Abaikan */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setShowRejectModal(true)}
            className="w-full text-xs font-semibold text-stone-600 hover:text-warm-coral hover:bg-rose-50 hover:border-rose-200"
          >
            <X className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Abaikan
          </Button>

          <Button
            variant="primary"
            isLoading={isPending}
            loadingText="Mencatat..."
            onClick={handleApprove}
            className="w-full text-xs font-bold bg-[#FFA259] hover:bg-[#F97316] text-stone-900 border border-orange-300 shadow-sm"
          >
            <Check className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Masukkan ke Kas
          </Button>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Pengabaian Notifikasi */}
      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleConfirmReject}
        isLoading={isPending}
        title="Abaikan Notifikasi Belanja Ini?"
        description={`Apakah kalian ingin mengabaikan catatan belanja dari ${item.source_app} sebesar ${formatRupiah(amount)}? Catatan ini tidak akan dimasukkan ke saldo kas bersama.`}
        confirmText="Abaikan"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
