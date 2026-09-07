import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import BottomNav from "@/components/bottom-nav";
import {
  PiggyBank,
  BellRing,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { PenguinMascot } from "@/components/ui/penguin-mascot";
import { MobileHeader } from "@/components/ui/mobile-header";
import { QuickExpenseBar } from "@/components/dashboard/quick-expense-bar";
import { SpendingCategoryBreakdown } from "@/components/dashboard/spending-category-breakdown";
import { Category } from "@/types/database";

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

  // Ambil transaksi bulan ini untuk saldo & grafik kategori yang akurat
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthTransactions } = await supabase
    .from("transactions")
    .select("*, categories(*)")
    .eq("space_id", space.id)
    .gte("transaction_date", startOfMonth.toISOString());

  // Ambil transaksi terkini untuk daftar mutasi
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, categories(*), profiles(full_name)")
    .eq("space_id", space.id)
    .order("transaction_date", { ascending: false })
    .limit(10);

  // Ambil daftar kategori di space ini
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,space_id.eq.${space.id}`)
    .order("name");

  // Hitung total pemasukan & pengeluaran bulan ini
  let totalIncome = 0;
  let totalExpense = 0;

  monthTransactions?.forEach((tx) => {
    if (tx.type === "income") {
      totalIncome += Number(tx.amount);
    } else {
      totalExpense += Number(tx.amount);
    }
  });

  const balance = totalIncome - totalExpense;

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Mobile Ergonomic App Bar */}
      <MobileHeader
        title={
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-black tracking-tight text-warm-espresso truncate">
              {space.name}
            </span>
            <span className="w-2 h-2 rounded-full bg-warm-coral shrink-0" aria-hidden="true" />
          </div>
        }
        subtitle="Saling Jaga, Saling Isi 💕"
        rightAction={
          <Link
            href="/space/settings"
            aria-label="Pengaturan celengan dan pasangan"
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full bg-white border border-warm-border text-xs font-bold text-stone-700 hover:border-warm-apricot hover:text-stone-900 transition-transform duration-75 active:scale-95 shadow-2xs shrink-0"
          >
            {members && members.length >= 2 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                <span className="text-xs font-bold">Berdua</span>
                <span className="text-[11px]">💕</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
                <span className="text-xs font-bold text-orange-700">+ Pasangan</span>
              </>
            )}
          </Link>
        }
      />

      <div className="px-4 py-3 space-y-5 flex-1 pb-28">

        {/* Banner Antrean Validasi Notifikasi */}
        {(pendingCount ?? 0) > 0 && (
          <Link
            href="/validations"
            aria-label={`${pendingCount} belanja otomatis menunggu ditinjau`}
            className="p-3.5 rounded-2xl bg-[#FFF9EC] border border-amber-200 flex items-center justify-between transition hover:border-amber-300 shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-orange-700 border border-amber-200 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-warm-espresso">
                  {pendingCount} Belanja Otomatis Perlu Ditinjau
                </p>
                <p className="text-[11px] text-stone-600">
                  Ada catatan dari notifikasi HP yang siap dimasukkan ke kas bersama.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" aria-hidden="true" />
          </Link>
        )}

        {/* Card Saldo Utama */}
        <section
          aria-label="Ringkasan Saldo dan Anggaran Bulan Ini"
          className="p-5 rounded-3xl bg-gradient-to-br from-[#FFF9EE] via-[#FFF4E1] to-[#FFECC2] border border-[#F3E1C0] text-stone-900 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Sisa Saldo Bulan Ini
              </span>
              <p className="text-3xl font-black tracking-tight text-warm-espresso mt-0.5 tabular-nums">
                {formatRupiah(balance)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/90 border border-amber-200/80 flex items-center justify-center text-orange-700 shadow-2xs">
              <PiggyBank className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>

          {/* Income & Expense Breakdown */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-amber-200/60">
            <div className="flex items-center gap-2.5 bg-white/75 rounded-2xl p-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0">
                <ArrowDownLeft className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Total Masuk
                </p>
                <p className="text-xs font-bold text-emerald-700 tracking-tight tabular-nums truncate">
                  + {formatRupiah(totalIncome)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/75 rounded-2xl p-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-warm-coral shrink-0">
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Total Keluar
                </p>
                <p className="text-xs font-bold text-warm-coral tracking-tight tabular-nums truncate">
                  - {formatRupiah(totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick-Input Satu Baris (Natural Language Parser + Shortcut Kamera Struk) */}
        <QuickExpenseBar
          spaceId={space.id}
          categories={(categories || []) as Category[]}
        />

        {/* Visualisasi Pembagian Pengeluaran per Kategori */}
        <SpendingCategoryBreakdown
          transactions={(monthTransactions || []) as any}
          categories={(categories || []) as Category[]}
        />

        {/* Transaksi Terbaru */}
        <section aria-label="Catatan Belanja Terkini" className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Catatan Belanja Terkini
            </h2>
            <Link
              href="/transactions"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
            >
              Lihat Semua
            </Link>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="rounded-3xl bg-white border border-warm-border divide-y divide-stone-100 shadow-2xs overflow-hidden">
              {transactions.map((tx: any) => {
                const isExpense = tx.type === "expense";
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 flex items-center justify-between transition hover:bg-[#FFFDF9]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isExpense
                            ? "bg-rose-50 border-rose-200/80 text-warm-coral"
                            : "bg-emerald-50 border-emerald-200/80 text-emerald-700"
                        }`}
                      >
                        {isExpense ? (
                          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" aria-hidden="true" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-warm-espresso truncate">
                          {tx.description || (isExpense ? "Pengeluaran" : "Pemasukan")}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          <span>{formatTanggal(tx.transaction_date)}</span>
                          <span>•</span>
                          <span>{tx.profiles?.full_name || "Pasangan"}</span>
                          {tx.source !== "manual" && (
                            <span className="px-1.5 py-0.2 rounded-md bg-[#FFF9EC] border border-amber-200 text-stone-800 font-semibold text-[10px]">
                              {tx.source === "webhook" ? "Otomatis" : "Foto Nota"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-bold tabular-nums tracking-tight ${
                          isExpense ? "text-warm-coral" : "text-emerald-700"
                        }`}
                      >
                        {isExpense ? "- " : "+ "}
                        {formatRupiah(tx.amount)}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {tx.categories?.name || "Kategori"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-dashed border-warm-border text-center space-y-3 shadow-2xs">
              <div className="flex justify-center">
                <PenguinMascot variant="pair" expression="sleeping" size="md" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-warm-espresso">
                  Dompet berdua masih tenang nih
                </p>
                <p className="text-[11px] text-stone-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Pingu & Penga lagi santai istirahat. Habis makan bareng atau jajan kopi berdua? Yuk catat pengeluaran pertama kalian! ☕🍰
                </p>
              </div>
              <Link
                href="/transactions/new"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#FFA259] hover:bg-[#F97316] text-stone-900 font-extrabold text-xs transition active:scale-[0.98] shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                Catat Pengeluaran Pertama
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Navigation */}
      <BottomNav pendingCount={pendingCount ?? 0} />
    </div>
  );
}
