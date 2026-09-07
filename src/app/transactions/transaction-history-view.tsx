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
import { PiggyMascot } from "@/components/ui/piggy-mascot";

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
        aria-label="Filter catatan belanja"
        className="flex items-center gap-2 overflow-x-auto pb-1 select-none"
      >
        <button
          type="button"
          aria-pressed={filterType === "all"}
          onClick={() => setFilterType("all")}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
            filterType === "all"
              ? "bg-[#FFA259] border-orange-300 text-stone-900 shadow-sm"
              : "bg-white border-warm-border text-stone-600 hover:text-stone-900 hover:border-warm-apricot"
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          aria-pressed={filterType === "expense"}
          onClick={() => setFilterType("expense")}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
            filterType === "expense"
              ? "bg-[#FF7E7E] border-rose-300 text-white shadow-sm"
              : "bg-white border-warm-border text-stone-600 hover:text-stone-900 hover:border-warm-apricot"
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          aria-pressed={filterType === "income"}
          onClick={() => setFilterType("income")}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
            filterType === "income"
              ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
              : "bg-white border-warm-border text-stone-600 hover:text-stone-900 hover:border-warm-apricot"
          }`}
        >
          Pemasukan
        </button>

        {/* Filter Kategori Dropdown */}
        <select
          aria-label="Filter kategori catatan"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white border border-warm-border text-xs font-semibold text-stone-700 focus:outline-none focus:border-warm-apricot shrink-0 shadow-2xs"
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
                className="p-3.5 rounded-2xl bg-white border border-warm-border flex items-center justify-between transition hover:border-amber-200 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isExpense
                        ? "bg-rose-50 border-rose-200/80 text-warm-coral"
                        : "bg-emerald-50 border-emerald-200/80 text-emerald-700"
                    }`}
                  >
                    {isExpense ? (
                      <TrendingDown className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <TrendingUp className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-warm-espresso truncate">
                      {tx.description || tx.category?.name || "Catatan"}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                      <span>{formatTanggal(tx.transaction_date)}</span>
                      <span aria-hidden="true">&bull;</span>
                      <span className="font-medium text-stone-600 truncate">
                        {tx.category?.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-xs font-bold tabular-nums tracking-tight ${
                        isExpense
                          ? "text-warm-coral"
                          : "text-emerald-700"
                      }`}
                    >
                      {isExpense ? "- " : "+ "}
                      {formatRupiah(tx.amount)}
                    </p>
                    {tx.source !== "manual" && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#FFF9EC] border border-amber-200 text-stone-800 font-semibold inline-block mt-0.5">
                        {tx.source === "webhook" ? "Otomatis" : "Foto Nota"}
                      </span>
                    )}
                  </div>

                  {/* Tombol Hapus */}
                  <button
                    type="button"
                    onClick={() => setPendingDeleteTx(tx)}
                    aria-label={`Hapus catatan ${tx.description || tx.category?.name || ""}`}
                    className="w-9 h-9 rounded-xl text-stone-400 hover:text-warm-coral hover:bg-rose-50 active:scale-95 transition flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-coral"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 px-4 text-center border border-dashed border-warm-border rounded-3xl bg-white space-y-2.5 shadow-2xs">
          <div className="flex justify-center">
            <PiggyMascot expression="sleeping" size="md" />
          </div>
          <p className="text-xs font-bold text-warm-espresso">
            Belum ada catatan belanja di sini
          </p>
          <p className="text-[11px] text-stone-500 max-w-xs mx-auto leading-relaxed">
            Catatan belanja kalian berdua akan muncul rapi di sini setelah ditambahkan.
          </p>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus */}
      <ConfirmModal
        isOpen={!!pendingDeleteTx}
        onClose={() => setPendingDeleteTx(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isPending}
        title="Hapus Catatan Belanja?"
        description={`Apakah Anda yakin ingin menghapus catatan "${pendingDeleteTx?.description || "Belanja"}" sebesar ${formatRupiah(pendingDeleteTx?.amount)}? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText="Hapus Catatan"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
