import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import TransactionForm from "./transaction-form";
import { ChevronLeft } from "lucide-react";
import { Category } from "@/types/database";
import { MobileHeader } from "@/components/ui/mobile-header";

export default async function NewTransactionPage() {
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

  // Ambil daftar kategori
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,space_id.eq.${spaceId}`)
    .order("name");

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Mobile Ergonomic App Bar */}
      <MobileHeader
        title="Catat Belanja Baru"
        subtitle="Ketik Manual atau Pindai Foto Nota"
        backHref="/dashboard"
      />

      <div className="px-4 py-3 space-y-4 flex-1 pb-28">

        {/* Form Container */}
        <TransactionForm
          spaceId={spaceId}
          categories={(categories || []) as Category[]}
        />
      </div>

      <BottomNav />
    </div>
  );
}
