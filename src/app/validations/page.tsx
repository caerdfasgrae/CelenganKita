import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import ValidationItem from "./validation-item";
import { BellRing, CheckCircle2, ChevronLeft, Sparkles, Smartphone } from "lucide-react";
import { Category, PendingValidation } from "@/types/database";
import { PiggyMascot } from "@/components/ui/piggy-mascot";

export default async function ValidationsPage() {
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

  // Ambil data antrean validasi yang masih 'pending'
  const { data: pendingItems } = await supabase
    .from("pending_validations")
    .select("*")
    .eq("space_id", spaceId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

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
                Tinjau Belanja Otomatis
              </h1>
              <p className="text-[11px] text-stone-500 font-medium">
                Dari Notifikasi HP & Dompet Digital
              </p>
            </div>
          </div>

          <Link
            href="/space/settings#webhook"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-warm-border text-stone-700 flex items-center gap-1.5 hover:border-warm-apricot hover:text-stone-900 transition shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5 text-orange-600" />
            Sambungan HP
          </Link>
        </div>

        {/* Info Banner */}
        <div className="p-3.5 rounded-2xl bg-[#FFF9EC] border border-amber-200 text-stone-800 text-xs flex items-start gap-2.5 shadow-2xs">
          <Sparkles className="w-4 h-4 shrink-0 text-orange-600 mt-0.5" />
          <p className="leading-relaxed text-[11px] text-stone-600">
            Belanjaan dari notifikasi HP tersimpan di sini dulu. Kalian berdua bisa memeriksa dan memilih untuk memasukkannya ke kas bersama atau abaikan.
          </p>
        </div>

        {/* List of Pending Items */}
        {pendingItems && pendingItems.length > 0 ? (
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <ValidationItem
                key={item.id}
                item={item as PendingValidation}
                categories={(categories || []) as Category[]}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-warm-border p-6 shadow-2xs">
            <div className="flex justify-center">
              <PiggyMascot expression="celebrate" size="md" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-warm-espresso">
                Semua Belanjaan Sudah Ditinjau Berdua 💕
              </h3>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto mt-1 leading-relaxed">
                Hore, semua catatan belanja sudah rapi! Belum ada notifikasi transaksi baru yang tertunda.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav pendingCount={pendingItems?.length || 0} />
    </div>
  );
}
