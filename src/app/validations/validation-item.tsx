"use client";

import { useState, useTransition } from "react";
import { Check, X, Edit3, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { Category, PendingValidation } from "@/types/database";
import { approveValidation, rejectValidation } from "@/app/validations/actions";

interface ValidationItemProps {
  item: PendingValidation;
  categories: Category[];
}

export default function ValidationItem({ item, categories }: ValidationItemProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.id || ""
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

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectValidation(item.id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="p-4 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
      {/* Top row: Source app badge & Date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
            {item.source_app}
          </span>
          <span className="text-[10px] text-slate-400">
            {formatTanggal(item.created_at)}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
            isExpense
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          }`}
        >
          {isExpense ? "Pengeluaran" : "Pemasukan"}
        </span>
      </div>

      {/* Raw Text snippet preview */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2">
        &ldquo;{item.raw_text}&rdquo;
      </div>

      {error && (
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Parsed Info or Edit Mode */}
      {isEditing ? (
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700">
          <div>
            <label className="text-[10px] font-semibold text-slate-500">
              Nominal (Rp)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500">
              Keterangan / Merchant
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-base font-black text-slate-900 dark:text-white">
              {formatRupiah(amount)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category selector & Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
            Kategori:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {categories
              .filter((c) => c.type === item.parsed_type)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>

        {/* Buttons: Setuju vs Tolak */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={isPending}
            onClick={handleReject}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            Tolak
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleApprove}
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Setuju Catat
          </button>
        </div>
      </div>
    </div>
  );
}
