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
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-xl bg-white border border-warm-border flex items-center justify-center text-stone-600 hover:text-warm-espresso hover:border-warm-apricot transition shadow-2xs"
              aria-label="Kembali ke Dasbor"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-warm-espresso tracking-tight">
                Riwayat Belanja
              </h1>
              <p className="text-[11px] text-stone-500 font-medium">
                Catatan Keuangan Berdua
              </p>
            </div>
          </div>

          <Link
            href="/transactions/new"
            className="w-8 h-8 rounded-xl bg-[#FFA259] text-stone-900 flex items-center justify-center hover:bg-[#F97316] border border-orange-300 transition shadow-sm"
            title="Tambah Belanja Baru"
            aria-label="Tambah Belanja Baru"
          >
            <Plus className="w-4 h-4" />
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
