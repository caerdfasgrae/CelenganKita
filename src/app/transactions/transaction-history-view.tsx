"use client";

import { useState, useTransition } from "react";
import {
  TrendingDown,
  TrendingUp,
  Trash2,
  Calendar,
  Filter,
  Loader2,
} from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { Category, Transaction } from "@/types/database";
import { deleteTransaction } from "@/app/transactions/actions";

interface TransactionHistoryViewProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function TransactionHistoryView({
  transactions,
  categories,
}: TransactionHistoryViewProps) {
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = transactions.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterCategory !== "all" && tx.category_id !== filterCategory) return false;
    return true;
  });

  function handleDelete(id: string) {
    if (!confirm("Hapus catatan transaksi ini?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteTransaction(id);
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
            filterType === "all"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setFilterType("expense")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
            filterType === "expense"
              ? "bg-rose-500 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setFilterType("income")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
            filterType === "income"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          Pemasukan
        </button>

        {/* Filter Kategori */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border-none text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none shrink-0"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const isExpense = tx.type === "expense";
            const isDeleting = deletingId === tx.id;

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isExpense
                        ? "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isExpense ? (
                      <TrendingDown className="w-5 h-5" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {tx.description || tx.category?.name || "Transaksi"}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span>{formatTanggal(tx.transaction_date)}</span>
                      <span>&bull;</span>
                      <span className="text-slate-500 font-medium">
                        {tx.category?.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={`text-xs font-black ${
                        isExpense
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatRupiah(tx.amount)}
                    </p>
                    {tx.source !== "manual" && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                        {tx.source === "webhook" ? "Otomatis" : "OCR"}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(tx.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition opacity-0 group-hover:opacity-100"
                    title="Hapus"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 text-xs">
          Tidak ada transaksi yang cocok dengan filter.
        </div>
      )}
    </div>
  );
}
