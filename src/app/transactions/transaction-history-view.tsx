"use client";

import { useState, useTransition } from "react";
import {
  TrendingDown,
  TrendingUp,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { Category, Transaction } from "@/types/database";
import { deleteTransaction } from "@/app/transactions/actions";
import { ConfirmModal } from "@/components/ui/confirm-modal";

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

  // State untuk dialog konfirmasi hapus
  const [pendingDeleteTx, setPendingDeleteTx] = useState<Transaction | null>(null);

  const filtered = transactions.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterCategory !== "all" && tx.category_id !== filterCategory) return false;
    return true;
  });

  function handleConfirmDelete() {
    if (!pendingDeleteTx) return;
    const id = pendingDeleteTx.id;

    startTransition(async () => {
      await deleteTransaction(id);
      setPendingDeleteTx(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter Row: Pengelompokan jenis & kategori */}
      <div
        role="group"
        aria-label="Filter transaksi"
        className="flex items-center gap-2 overflow-x-auto pb-1 select-none"
      >
        <button
          type="button"
          aria-pressed={filterType === "all"}
          onClick={() => setFilterType("all")}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            filterType === "all"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          aria-pressed={filterType === "expense"}
          onClick={() => setFilterType("expense")}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            filterType === "expense"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          aria-pressed={filterType === "income"}
          onClick={() => setFilterType("income")}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
            filterType === "income"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Pemasukan
        </button>

        {/* Filter Kategori Dropdown */}
        <select
          aria-label="Filter kategori transaksi"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
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

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between transition hover:border-slate-300 dark:hover:border-slate-600"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isExpense
                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isExpense ? (
                      <TrendingDown className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <TrendingUp className="w-5 h-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tx.description || tx.category?.name || "Transaksi"}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{formatTanggal(tx.transaction_date)}</span>
                      <span aria-hidden="true">&bull;</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                        {tx.category?.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-xs font-black tracking-tight ${
                        isExpense
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {/* Simbol eksplisit tanda + atau - memenuhi syarat a11y non-color only */}
                      {isExpense ? "- " : "+ "}
                      {formatRupiah(tx.amount)}
                    </p>
                    {tx.source !== "manual" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold inline-block mt-0.5">
                        {tx.source === "webhook" ? "Otomatis" : "OCR"}
                      </span>
                    )}
                  </div>

                  {/* Tombol Hapus: Terlihat permanen di HP (tidak terkunci hover) & touch target >= 44x44px */}
                  <button
                    type="button"
                    onClick={() => setPendingDeleteTx(tx)}
                    aria-label={`Hapus catatan transaksi ${tx.description || tx.category?.name || ""}`}
                    className="w-11 h-11 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 text-xs">
          Tidak ada catatan transaksi yang sesuai dengan filter.
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus (Pengganti window.confirm) */}
      <ConfirmModal
        isOpen={!!pendingDeleteTx}
        onClose={() => setPendingDeleteTx(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isPending}
        title="Hapus Catatan Transaksi?"
        description={`Apakah Anda yakin ingin menghapus catatan "${pendingDeleteTx?.description || "Transaksi"}" sebesar ${formatRupiah(pendingDeleteTx?.amount)}? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText="Hapus Transaksi"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
