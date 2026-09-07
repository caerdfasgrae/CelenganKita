import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import TransactionForm from "./transaction-form";
import { ChevronLeft } from "lucide-react";
import { Category } from "@/types/database";
import { MobileHeader } from "@/components/ui/mobile-header";
import { DesktopHeader } from "@/components/ui/desktop-header";

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
        title="Catat Belanja Baru"
        subtitle="Ketik Manual atau Pindai Foto Nota"
        backHref="/dashboard"
      />

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 flex-1 pb-28 md:pb-12">
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
