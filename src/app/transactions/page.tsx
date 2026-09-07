import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import TransactionHistoryView from "./transaction-history-view";
import { ChevronLeft, Plus } from "lucide-react";
import { Category, Transaction } from "@/types/database";
import { MobileHeader } from "@/components/ui/mobile-header";
import { DesktopHeader } from "@/components/ui/desktop-header";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil Space ID yang aktif
  const { data: memberRecord } = await supabase
    .from("space_members")
    .select("space_id, spaces(name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!memberRecord) {
    redirect("/space/setup");
  }

  const spaceId = memberRecord.space_id;
  const spaceName = (memberRecord.spaces as any)?.name || "Celengan Bersama";

  // Ambil transaksi di space ini
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, categories(*), profiles(full_name)")
    .eq("space_id", spaceId)
    .order("transaction_date", { ascending: false });

  // Ambil daftar kategori
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,space_id.eq.${spaceId}`)
    .order("name");

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Desktop Top Header Navigation */}
      <DesktopHeader spaceName={spaceName} />

      {/* Mobile Ergonomic App Bar */}
      <MobileHeader
        hideOnDesktop={true}
        title="Riwayat Belanja"
        subtitle="Catatan Kas Berdua"
        backHref="/dashboard"
        rightAction={
          <Link
            href="/transactions/new"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#FFA259] text-stone-900 flex items-center justify-center hover:bg-[#F97316] border border-orange-300 transition-transform duration-75 active:scale-95 shadow-sm"
            title="Tambah Belanja Baru"
            aria-label="Tambah Belanja Baru"
          >
            <Plus className="w-5 h-5" />
          </Link>
        }
      />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 flex-1 pb-28 md:pb-12">

        <TransactionHistoryView
          transactions={(transactions || []) as Transaction[]}
          categories={(categories || []) as Category[]}
        />
      </div>

      <BottomNav />
    </div>
  );
}
