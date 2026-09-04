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
      <div className="p-4 space-y-4 flex-1">
        {/* Top Bar Header */}
        <header className="flex items-center justify-between pt-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ruang Dompet
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
            </div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {space.name}
            </h1>
          </div>

          <Link
            href="/space/settings"
            aria-label="Pengaturan ruang dan anggota"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{members?.length || 1} Pasangan</span>
          </Link>
        </header>

        {/* Banner Antrean Validasi Notifikasi (Fitur 1) */}
        {(pendingCount ?? 0) > 0 && (
          <Link
            href="/validations"
            aria-label={`${pendingCount} notifikasi m-banking menunggu validasi`}
            className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/80 flex items-center justify-between transition hover:opacity-95"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BellRing className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {pendingCount} Notifikasi Perlu Divalidasi!
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Data otomatis dari ponsel siap dikonfirmasi ke kas.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          </Link>
        )}

        {/* Card Saldo Utama */}
        <section
          aria-label="Ringkasan Saldo dan Anggaran Bulan Ini"
          className="p-5 rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-900/10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-100">
              Sisa Anggaran Bersama Bulan Ini
            </span>
            <div className="p-1.5 rounded-lg bg-white/15">
              <PiggyBank className="w-4 h-4 text-emerald-200" aria-hidden="true" />
            </div>
          </div>

          <div>
            <p className="text-3xl font-black tracking-tight">
              {formatRupiah(balance)}
            </p>
          </div>

          {/* Income & Expense Breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/40 flex items-center justify-center text-emerald-100 shrink-0">
                <ArrowDownLeft className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-200 uppercase font-semibold">
                  Pemasukan
                </p>
                <p className="text-xs font-bold text-white tracking-tight">
                  + {formatRupiah(totalIncome)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/40 flex items-center justify-center text-rose-100 shrink-0">
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] text-rose-200 uppercase font-semibold">
                  Pengeluaran
                </p>
                <p className="text-xs font-bold text-white tracking-tight">
                  - {formatRupiah(totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Action Buttons (Touch Target >= 44px, rounded-lg) */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/transactions/new"
            className="min-h-[48px] p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition group"
          >
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition shrink-0">
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Catat Transaksi
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Manual
              </p>
            </div>
          </Link>

          <Link
            href="/transactions/new?mode=ocr"
            className="min-h-[48px] p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition group"
          >
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition shrink-0">
              <ScanLine className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Scan Struk (OCR)
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Kamera / Galeri
              </p>
            </div>
          </Link>
        </div>

        {/* Transaksi Terbaru */}
        <section aria-label="Riwayat Transaksi Terkini" className="space-y-2.5 pt-1">
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
                    className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between transition hover:border-slate-300 dark:hover:border-slate-600"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isExpense
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isExpense ? (
                          <TrendingDown className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <TrendingUp className="w-4 h-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {tx.description || tx.categories?.name || "Transaksi"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span>{formatTanggal(tx.transaction_date)}</span>
                          {tx.source !== "manual" && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {tx.source === "webhook" ? "Otomatis" : "OCR"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-black tracking-tight ${
                          isExpense
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isExpense ? "- " : "+ "}
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
            <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <PiggyBank className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Belum ada transaksi bulan ini
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Mulai catat transaksi manual atau sambungkan notifikasi e-wallet ponsel Anda.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Navigation */}
      <BottomNav pendingCount={pendingCount ?? 0} />
    </div>
  );
}
