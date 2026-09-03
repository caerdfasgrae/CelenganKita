import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import TransactionHistoryView from "./transaction-history-view";
import { ChevronLeft, Plus } from "lucide-react";
import { Category, Transaction } from "@/types/database";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil Space aktif
  const { data: memberRecord } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!memberRecord) {
    redirect("/space/setup");
  }

  const spaceId = memberRecord.space_id;

  // Ambil semua transaksi di space ini
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("space_id", spaceId)
    .order("transaction_date", { ascending: false });

  // Ambil kategori
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,space_id.eq.${spaceId}`)
    .order("name");

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="p-5 space-y-4 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                Riwayat Transaksi
              </h1>
              <p className="text-[11px] text-slate-500">
                Pencatatan Keuangan Bersama
              </p>
            </div>
          </div>

          <Link
            href="/transactions/new"
            className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/20"
            title="Tambah Transaksi"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>

        <TransactionHistoryView
          transactions={(transactions || []) as Transaction[]}
          categories={(categories || []) as Category[]}
        />
      </div>

      <BottomNav />
    </div>
  );
}
