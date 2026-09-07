"use client";

import { useMemo } from "react";
import { formatRupiah } from "@/lib/utils";
import { Category, Transaction } from "@/types/database";
import { PieChart, Sparkles } from "lucide-react";
import { PenguinMascot } from "@/components/ui/penguin-mascot";

interface SpendingCategoryBreakdownProps {
  transactions: Transaction[];
  categories: Category[];
}

// Warm cozy palette for category segments
const CATEGORY_COLORS = [
  "#FFA259", // Warm Apricot
  "#FF7E7E", // Coral Rose
  "#FFCB56", // Honey Amber
  "#10B981", // Warm Emerald
  "#60A5FA", // Sky Blue
  "#A78BFA", // Lavender Violet
  "#F472B6", // Soft Pink
  "#FBBF24", // Golden Sun
];

export function SpendingCategoryBreakdown({
  transactions,
  categories,
}: SpendingCategoryBreakdownProps) {
  // Aggregate expenses by category for current month
  const { categoryStats, totalExpense } = useMemo(() => {
    let total = 0;
    const catMap = new Map<string, { name: string; amount: number }>();

    // Initialize map with known categories
    categories.forEach((cat) => {
      if (cat.type === "expense") {
        catMap.set(cat.id, { name: cat.name, amount: 0 });
      }
    });

    // Sum transactions
    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        const amt = Number(tx.amount) || 0;
        total += amt;
        const catId = tx.category_id;
        const existing = catMap.get(catId);
        if (existing) {
          existing.amount += amt;
        } else {
          // If transaction has custom or unlisted category
          const name = (tx as any).categories?.name || "Lain-lain";
          catMap.set(catId, { name, amount: amt });
        }
      }
    });

    // Filter only categories with spending > 0, sort descending
    const stats = Array.from(catMap.entries())
      .map(([id, item], index) => ({
        id,
        name: item.name,
        amount: item.amount,
        percentage: total > 0 ? Math.round((item.amount / total) * 100) : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .filter((s) => s.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return { categoryStats: stats, totalExpense: total };
  }, [transactions, categories]);

  if (totalExpense === 0 || categoryStats.length === 0) {
    return (
      <section
        aria-label="Pembagian Pengeluaran per Kategori"
        className="p-5 rounded-3xl bg-white border border-warm-border text-center space-y-3 shadow-2xs select-none"
      >
        <div className="flex justify-center">
          <PenguinMascot variant="pair" expression="happy" size="sm" />
        </div>
        <div>
          <h3 className="text-xs font-black text-warm-espresso">
            Belum Ada Pengeluaran Bulan Ini
          </h3>
          <p className="text-[11px] text-stone-500 max-w-xs mx-auto mt-0.5 leading-relaxed">
            Kas kalian masih utuh dan tersimpan rapi. Catat belanjaan pertama kalian lewat form atau Catat Cepat di atas!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Pembagian Pengeluaran per Kategori"
      className="p-4 sm:p-5 rounded-3xl bg-white border border-warm-border space-y-3.5 shadow-2xs select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-orange-700 shrink-0">
            <PieChart className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-black text-warm-espresso">
              Pengeluaran per Kategori
            </h3>
            <p className="text-[10px] text-stone-500 font-medium">
              Kemana uang jajan berdua mengalir bulan ini
            </p>
          </div>
        </div>
        <span className="text-xs font-black text-warm-espresso tabular-nums">
          {formatRupiah(totalExpense)}
        </span>
      </div>

      {/* Multi-Segment Proportion Bar */}
      <div
        className="w-full h-3 rounded-full bg-stone-100 flex overflow-hidden p-0.5 gap-0.5 border border-warm-border/60"
        role="meter"
        aria-label="Proporsi pengeluaran per kategori"
        aria-valuenow={100}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {categoryStats.map((cat) => (
          <div
            key={cat.id}
            style={{
              width: `${Math.max(cat.percentage, 3)}%`,
              backgroundColor: cat.color,
            }}
            className="h-full rounded-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            title={`${cat.name}: ${cat.percentage}% (${formatRupiah(cat.amount)})`}
          />
        ))}
      </div>

      {/* Category Breakdown List */}
      <div className="space-y-2.5 pt-1">
        {categoryStats.map((cat) => (
          <div key={cat.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <span className="font-bold text-warm-espresso truncate">
                  {cat.name}
                </span>
                <span className="text-[10px] font-extrabold text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded-md">
                  {cat.percentage}%
                </span>
              </div>
              <span className="font-extrabold text-warm-espresso tabular-nums shrink-0">
                {formatRupiah(cat.amount)}
              </span>
            </div>

            {/* Individual Category Soft Progress Track */}
            <div
              className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden"
              role="progressbar"
              aria-valuenow={cat.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Persentase ${cat.name}`}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
