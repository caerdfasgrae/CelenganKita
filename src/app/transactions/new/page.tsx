import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import TransactionForm from "./transaction-form";
import { ChevronLeft } from "lucide-react";
import { Category } from "@/types/database";

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
      <div className="p-5 space-y-4 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2.5 pt-2">
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-xl bg-white border border-warm-border flex items-center justify-center text-stone-600 hover:text-warm-espresso hover:border-warm-apricot transition shadow-2xs"
            aria-label="Kembali ke Dasbor"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-warm-espresso tracking-tight">
              Catat Belanja Baru
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">
              Ketik Manual atau Pindai Foto Nota
            </p>
          </div>
        </div>

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
