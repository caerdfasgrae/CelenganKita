import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import BottomNav from "@/components/bottom-nav";
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  BellRing,
  ArrowUpRight,
  ArrowDownLeft,
  ScanLine,
  PlusCircle,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil Space yang diikuti user
  const { data: memberRecord } = await supabase
    .from("space_members")
    .select("space_id, role, nickname, spaces(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!memberRecord || !memberRecord.spaces) {
    redirect("/space/setup");
  }

  const space = memberRecord.spaces as any;

  // Ambil semua anggota di Space ini
  const { data: members } = await supabase
    .from("space_members")
    .select("user_id, role, nickname, profiles(full_name, avatar_url)")
    .eq("space_id", space.id);

  // Ambil jumlah pending validations
  const { count: pendingCount } = await supabase
    .from("pending_validations")
    .select("*", { count: "exact", head: true })
    .eq("space_id", space.id)
    .eq("status", "pending");

  // Ambil transaksi bulan ini
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, categories(*), profiles(full_name)")
    .eq("space_id", space.id)
    .order("transaction_date", { ascending: false })
    .limit(20);

  // Hitung total pemasukan & pengeluaran bulan ini
  let totalIncome = 0;
  let totalExpense = 0;

  transactions?.forEach((tx) => {
    const txDate = new Date(tx.transaction_date);
    if (txDate >= startOfMonth) {
      if (tx.type === "income") {
        totalIncome += Number(tx.amount);
      } else {
        totalExpense += Number(tx.amount);
      }
    }
  });

  const balance = totalIncome - totalExpense;

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="p-5 space-y-5 flex-1">
        {/* Top Bar Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ruang Dompet
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {space.name}
            </h1>
          </div>

          <Link
            href="/space/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>{members?.length || 1} Pasangan</span>
          </Link>
        </div>

        {/* Banner Antrean Validasi Notifikasi (Fitur 1) */}
        {(pendingCount ?? 0) > 0 && (
          <Link
            href="/validations"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-700 flex items-center justify-between transition hover:opacity-95"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {pendingCount} Notifikasi Menunggu Validasi!
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Data otomatis dari HP Anda/Pasangan siap diverifikasi.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        )}

        {/* Card Saldo Utama */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-700/20 relative overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-100">
                Sisa Anggaran Bersama Bulan Ini
              </span>
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-xs">
                <PiggyBank className="w-4 h-4 text-emerald-200" />
              </div>
            </div>

            <div>
              <p className="text-3xl font-black tracking-tight">
                {formatRupiah(balance)}
              </p>
            </div>

            {/* Income & Expense Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-200 shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-200 uppercase font-semibold">
                    Pemasukan
                  </p>
                  <p className="text-xs font-bold text-white">
                    {formatRupiah(totalIncome)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/30 flex items-center justify-center text-rose-200 shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-rose-200 uppercase font-semibold">
                    Pengeluaran
                  </p>
                  <p className="text-xs font-bold text-white">
                    {formatRupiah(totalExpense)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/transactions/new"
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition group"
          >
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Catat Transaksi
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Pemasukan / Pengeluaran
              </p>
            </div>
          </Link>

          <Link
            href="/transactions/new?mode=ocr"
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition group"
          >
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Scan Struk (OCR)
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Kamera / Galeri HP
              </p>
            </div>
          </Link>
        </div>

        {/* Transaksi Terbaru */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Riwayat Transaksi Terkini
            </h2>
            <Link
              href="/transactions"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx: any) => {
                const isExpense = tx.type === "expense";
                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpense
                            ? "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                            : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isExpense ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {tx.description || tx.categories?.name || "Transaksi"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {formatTanggal(tx.transaction_date)}
                          </span>
                          {tx.source !== "manual" && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {tx.source === "webhook" ? "Otomatis" : "OCR"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
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
                      <p className="text-[10px] text-slate-400">
                        {tx.categories?.name || "Kategori"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <PiggyBank className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Belum ada transaksi bulan ini
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Mulai catat transaksi manual atau sambungkan notifikasi e-wallet HP kamu.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav pendingCount={pendingCount ?? 0} />
    </div>
  );
}
